import csv
from functools import wraps

from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from django.views.decorators.http import require_http_methods

from .forms import (
    LabForm,
    QuestionForm,
    SessionCodeForm,
    SessionForm,
    StudentInfoForm,
    TeacherLoginForm,
    TeacherRegisterForm,
)
from .models import Answer, Lab, LabSession, Question, Submission

User = get_user_model()

SESSION_STUDENT_KEY = "student_info"


# ──────────────────── public landing + student session entry ────────────────────

def home(request):
    code_form = SessionCodeForm()
    return render(request, "labs/home.html", {"code_form": code_form})


def session_enter(request):
    """Handles the code form from the landing page."""
    if request.method != "POST":
        return redirect("labs:home")
    form = SessionCodeForm(request.POST)
    if not form.is_valid():
        return render(request, "labs/home.html", {"code_form": form})
    code = form.cleaned_data["code"]
    try:
        session = LabSession.objects.select_related("lab").get(code=code)
    except LabSession.DoesNotExist:
        messages.error(request, "Сабақ табылмады. Кодты қайта тексеріңіз.")
        return render(request, "labs/home.html", {"code_form": form})
    if not session.is_open:
        messages.error(request, "Бұл сабақ сессиясы жабық.")
        return render(request, "labs/home.html", {"code_form": form})
    return redirect("labs:session_start", code=session.code)


def session_start(request, code):
    session = get_object_or_404(
        LabSession.objects.select_related("lab"), code=code.lower()
    )
    if not session.is_open:
        return render(request, "labs/session_closed.html", {"session": session})
    if request.method == "POST":
        form = StudentInfoForm(request.POST)
        if form.is_valid():
            request.session[SESSION_STUDENT_KEY] = form.cleaned_data
            request.session[f"session_code"] = session.code
            request.session.set_expiry(60 * 60 * 4)
            return redirect("labs:session_work", code=session.code)
    else:
        prefill = request.session.get(SESSION_STUDENT_KEY) or {}
        form = StudentInfoForm(initial=prefill)
    return render(
        request, "labs/session_start.html", {"session": session, "form": form}
    )


def session_work(request, code):
    session = get_object_or_404(
        LabSession.objects.select_related("lab"), code=code.lower()
    )
    if not session.is_open:
        return render(request, "labs/session_closed.html", {"session": session})
    student = request.session.get(SESSION_STUDENT_KEY)
    if not student or request.session.get("session_code") != session.code:
        return redirect("labs:session_start", code=session.code)

    questions = list(session.lab.questions.all())
    if request.method == "POST":
        return _submit_answers(request, session, questions, student)
    return render(
        request,
        "labs/lab_work.html",
        {"session": session, "lab": session.lab, "questions": questions, "student": student},
    )


@transaction.atomic
def _submit_answers(request, session, questions, student):
    submission = Submission.objects.create(
        session=session,
        lab=session.lab,
        student_name=student["student_name"],
        student_class=student["student_class"],
        student_school=student["student_school"],
    )
    score = 0
    max_score = 0
    for q in questions:
        if q.is_mcq:
            max_score += q.points
            raw = request.POST.get(f"q{q.id}")
            try:
                chosen = int(raw) if raw is not None else None
            except (TypeError, ValueError):
                chosen = None
            is_correct = chosen is not None and chosen == q.correct_option
            if is_correct:
                score += q.points
            Answer.objects.create(
                submission=submission, question=q,
                chosen_option=chosen, is_correct=is_correct,
            )
        else:
            text = (request.POST.get(f"q{q.id}") or "").strip()
            Answer.objects.create(
                submission=submission, question=q,
                text_answer=text, is_correct=False,
            )
    submission.score = score
    submission.max_score = max_score
    percent = (score * 100 // max_score) if max_score else 0
    submission.passed = max_score > 0 and percent >= session.lab.pass_threshold
    submission.save()
    return redirect("labs:session_result", code=session.code, submission_id=submission.id)


def _annotate_answers(answers):
    for a in answers:
        if a.question.kind == Question.MULTIPLE_CHOICE:
            opts = a.question.options or []
            a.chosen_text = (
                opts[a.chosen_option]
                if a.chosen_option is not None and 0 <= a.chosen_option < len(opts)
                else "—"
            )
            co = a.question.correct_option
            a.correct_text = opts[co] if co is not None and 0 <= co < len(opts) else "—"
        else:
            a.chosen_text = a.text_answer or "—"
            a.correct_text = ""
    return answers


def session_result(request, code, submission_id):
    session = get_object_or_404(LabSession.objects.select_related("lab"), code=code.lower())
    submission = get_object_or_404(Submission, id=submission_id, session=session)
    answers = _annotate_answers(list(submission.answers.select_related("question").all()))
    return render(
        request,
        "labs/lab_result.html",
        {
            "session": session,
            "lab": session.lab,
            "submission": submission,
            "answers": answers,
        },
    )


# ──────────────────── teacher auth ────────────────────

def teacher_register(request):
    if request.user.is_authenticated:
        return redirect("labs:teacher_dashboard")
    if request.method == "POST":
        form = TeacherRegisterForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data["email"]
            user = User.objects.create_user(
                username=email,
                email=email,
                password=form.cleaned_data["password"],
            )
            parts = form.cleaned_data["full_name"].strip().split(None, 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
            user.save()
            auth_login(request, user)
            messages.success(request, "Тіркелу сәтті. Қош келдіңіз!")
            return redirect("labs:teacher_dashboard")
    else:
        form = TeacherRegisterForm()
    return render(request, "labs/teacher_register.html", {"form": form})


def teacher_login(request):
    if request.user.is_authenticated:
        return redirect("labs:teacher_dashboard")
    if request.method == "POST":
        form = TeacherLoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data["email"].strip().lower()
            user = authenticate(
                request, username=email, password=form.cleaned_data["password"]
            )
            if user is None:
                messages.error(request, "Email немесе құпиясөз қате.")
            else:
                auth_login(request, user)
                next_url = request.GET.get("next") or reverse("labs:teacher_dashboard")
                return redirect(next_url)
    else:
        form = TeacherLoginForm()
    return render(request, "labs/teacher_login.html", {"form": form})


def teacher_logout(request):
    auth_logout(request)
    return redirect("labs:home")


# ──────────────────── teacher dashboard, labs, sessions ────────────────────

def teacher_required(view):
    @wraps(view)
    def _w(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(f"{reverse('labs:teacher_login')}?next={request.path}")
        return view(request, *args, **kwargs)

    return _w


@teacher_required
def teacher_dashboard(request):
    labs = Lab.objects.filter(created_by=request.user).order_by("-created_at")
    sessions = (
        LabSession.objects.filter(teacher=request.user)
        .select_related("lab")
        .order_by("-created_at")[:10]
    )
    return render(
        request,
        "labs/teacher_dashboard.html",
        {"labs": labs, "sessions": sessions},
    )


@teacher_required
def teacher_lab_new(request):
    return _lab_editor(request, lab=None)


@teacher_required
def teacher_lab_edit(request, lab_id):
    lab = get_object_or_404(Lab, id=lab_id, created_by=request.user)
    return _lab_editor(request, lab=lab)


@transaction.atomic
def _lab_editor(request, lab):
    is_new = lab is None
    if request.method == "POST":
        action = request.POST.get("action", "save")
        form = LabForm(request.POST, request.FILES, instance=lab)
        if action == "add_question" and not is_new:
            qform = QuestionForm(request.POST, prefix="newq")
            if qform.is_valid():
                q = qform.save(commit=False)
                q.lab = lab
                q.save()
                messages.success(request, "Сұрақ қосылды.")
                return redirect("labs:teacher_lab_edit", lab_id=lab.id)
        elif action.startswith("delete_question:"):
            qid = int(action.split(":", 1)[1])
            Question.objects.filter(id=qid, lab=lab).delete()
            return redirect("labs:teacher_lab_edit", lab_id=lab.id)
        else:
            if form.is_valid():
                saved = form.save(commit=False)
                if is_new:
                    saved.created_by = request.user
                if not saved.slug:
                    saved.slug = slugify(saved.title, allow_unicode=False) or f"lab-{Lab.objects.count() + 1}"
                # HTML file upload (optional, overrides pasted content)
                uploaded = request.FILES.get("html_file")
                if uploaded:
                    try:
                        content = uploaded.read().decode("utf-8", errors="replace")
                        saved.animation_html = content
                    except Exception:
                        messages.error(request, "HTML файлды оқу мүмкін болмады.")
                saved.save()
                messages.success(request, "Сақталды.")
                return redirect("labs:teacher_lab_edit", lab_id=saved.id)
    else:
        form = LabForm(instance=lab)

    questions = list(lab.questions.all()) if lab else []
    qform = QuestionForm(prefix="newq", initial={"order": len(questions) + 1})
    return render(
        request,
        "labs/teacher_lab_form.html",
        {"form": form, "lab": lab, "questions": questions, "qform": qform, "is_new": is_new},
    )


@teacher_required
@require_http_methods(["POST"])
def teacher_lab_delete(request, lab_id):
    lab = get_object_or_404(Lab, id=lab_id, created_by=request.user)
    lab.delete()
    messages.success(request, "Зертхана өшірілді.")
    return redirect("labs:teacher_dashboard")


@teacher_required
def teacher_sessions(request):
    sessions = (
        LabSession.objects.filter(teacher=request.user)
        .select_related("lab")
        .order_by("-created_at")
    )
    return render(request, "labs/teacher_sessions.html", {"sessions": sessions})


@teacher_required
def teacher_session_new(request):
    if request.method == "POST":
        form = SessionForm(request.POST, teacher=request.user)
        if form.is_valid():
            s = form.save(commit=False)
            s.teacher = request.user
            s.save()
            messages.success(request, "Сабақ сессиясы жасалды.")
            return redirect("labs:teacher_session_detail", code=s.code)
    else:
        form = SessionForm(teacher=request.user)
    if not Lab.objects.filter(created_by=request.user).exists():
        messages.info(request, "Алдымен зертхана қосыңыз.")
    return render(request, "labs/teacher_session_form.html", {"form": form, "is_new": True})


@teacher_required
def teacher_session_detail(request, code):
    session = get_object_or_404(
        LabSession.objects.select_related("lab"), code=code.lower(), teacher=request.user
    )
    subs = session.submissions.all().order_by("-submitted_at")
    share_url = request.build_absolute_uri(
        reverse("labs:session_start", kwargs={"code": session.code})
    )
    return render(
        request,
        "labs/teacher_session_detail.html",
        {"session": session, "submissions": subs, "share_url": share_url},
    )


@teacher_required
@require_http_methods(["POST"])
def teacher_session_toggle(request, code):
    session = get_object_or_404(LabSession, code=code.lower(), teacher=request.user)
    session.is_active = not session.is_active
    session.save(update_fields=["is_active"])
    return redirect("labs:teacher_session_detail", code=session.code)


@teacher_required
@require_http_methods(["POST"])
def teacher_session_delete(request, code):
    session = get_object_or_404(LabSession, code=code.lower(), teacher=request.user)
    session.delete()
    messages.success(request, "Сабақ сессиясы өшірілді.")
    return redirect("labs:teacher_sessions")


@teacher_required
def teacher_reports(request):
    qs = (
        Submission.objects.select_related("lab", "session")
        .filter(session__teacher=request.user)
        .order_by("-submitted_at")
    )
    f_session = request.GET.get("session") or ""
    f_class = (request.GET.get("klass") or "").strip()
    f_school = (request.GET.get("school") or "").strip()
    if f_session:
        qs = qs.filter(session__code=f_session.lower())
    if f_class:
        qs = qs.filter(student_class__icontains=f_class)
    if f_school:
        qs = qs.filter(student_school__icontains=f_school)
    sessions = LabSession.objects.filter(teacher=request.user).select_related("lab").order_by("-created_at")
    return render(
        request,
        "labs/teacher_reports.html",
        {
            "submissions": qs[:500],
            "sessions": sessions,
            "f_session": f_session,
            "f_class": f_class,
            "f_school": f_school,
            "total": qs.count(),
        },
    )


@teacher_required
def teacher_submission_detail(request, submission_id):
    submission = get_object_or_404(
        Submission.objects.select_related("lab", "session"),
        id=submission_id,
        session__teacher=request.user,
    )
    answers = _annotate_answers(list(submission.answers.select_related("question").all()))
    return render(
        request,
        "labs/teacher_submission_detail.html",
        {"submission": submission, "answers": answers},
    )


@teacher_required
def teacher_reports_csv(request):
    qs = (
        Submission.objects.select_related("lab", "session")
        .filter(session__teacher=request.user)
        .order_by("-submitted_at")
    )
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="tapsyrma-labs-esep.csv"'
    response.write("﻿")
    writer = csv.writer(response)
    writer.writerow([
        "Күні", "Сессия", "Зертхана", "Аты-жөні", "Сыныбы", "Мектебі",
        "Балл", "Макс", "%", "Өтті",
    ])
    for s in qs:
        writer.writerow([
            s.submitted_at.strftime("%Y-%m-%d %H:%M"),
            s.session.code if s.session else "—",
            s.lab.title,
            s.student_name,
            s.student_class,
            s.student_school,
            s.score,
            s.max_score,
            s.percent,
            "иә" if s.passed else "жоқ",
        ])
    return response
