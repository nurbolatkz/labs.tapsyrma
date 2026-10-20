import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone


def _default_session_code() -> str:
    alphabet = "abcdefghjkmnpqrstuvwxyz23456789"  # unambiguous
    return "".join(secrets.choice(alphabet) for _ in range(8))


class Lab(models.Model):
    title = models.CharField("Атауы", max_length=200)
    slug = models.SlugField("URL кілт", max_length=80, unique=True)
    description = models.CharField("Қысқаша сипаттама", max_length=400, blank=True)
    animation_html = models.TextField(
        "Анимация HTML",
        help_text="Оқушыға iframe ішінде көрсетіледі. Таза HTML+CSS+JS.",
        blank=True,
    )
    pass_threshold = models.PositiveSmallIntegerField(
        "Өту пайызы", default=60, help_text="0-100. Автоматты бағаланатын сұрақтар бойынша."
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="labs",
    )
    is_published = models.BooleanField("Жарияланған", default=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Зертхана"
        verbose_name_plural = "Зертханалар"

    def __str__(self):
        return self.title


class Question(models.Model):
    MULTIPLE_CHOICE = "mcq"
    TEXT = "text"
    KIND_CHOICES = [
        (MULTIPLE_CHOICE, "Тест (бір дұрыс жауап)"),
        (TEXT, "Ашық мәтін"),
    ]

    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name="questions")
    order = models.PositiveSmallIntegerField("Реті", default=1)
    kind = models.CharField("Түрі", max_length=8, choices=KIND_CHOICES, default=MULTIPLE_CHOICE)
    prompt = models.TextField("Сұрақ мәтіні")
    options = models.JSONField(
        "Нұсқалар",
        default=list,
        blank=True,
        help_text='Тест үшін. Мысалы: ["Ядро", "Митохондрия", "Рибосома"]',
    )
    correct_option = models.PositiveSmallIntegerField(
        "Дұрыс нұсқа №",
        null=True,
        blank=True,
        help_text="0-ден басталады. Тек тест үшін.",
    )
    points = models.PositiveSmallIntegerField("Балл", default=1)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Сұрақ"
        verbose_name_plural = "Сұрақтар"

    def __str__(self):
        return f"№{self.order}: {self.prompt[:40]}"

    @property
    def is_mcq(self) -> bool:
        return self.kind == self.MULTIPLE_CHOICE


class LabSession(models.Model):
    code = models.CharField(
        "Сессия коды", max_length=16, unique=True, default=_default_session_code
    )
    title = models.CharField("Сабақ атауы", max_length=200, blank=True)
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name="sessions")
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lab_sessions",
    )
    is_active = models.BooleanField("Белсенді", default=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    expires_at = models.DateTimeField("Жарамдылық мерзімі", null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Сабақ сессиясы"
        verbose_name_plural = "Сабақ сессиялары"

    def __str__(self):
        return f"{self.code} · {self.lab.title}"

    @property
    def is_open(self) -> bool:
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        return True


class Submission(models.Model):
    session = models.ForeignKey(
        LabSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submissions",
    )
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name="submissions")
    student_name = models.CharField("Аты-жөні", max_length=120)
    student_class = models.CharField("Сыныбы", max_length=40)
    student_school = models.CharField("Мектебі", max_length=200)
    score = models.PositiveSmallIntegerField("Балл", default=0)
    max_score = models.PositiveSmallIntegerField("Максимал балл", default=0)
    passed = models.BooleanField("Өтті", default=False)
    submitted_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        ordering = ["-submitted_at"]
        verbose_name = "Жауап"
        verbose_name_plural = "Жауаптар"

    def __str__(self):
        return f"{self.student_name} — {self.lab.title}"

    @property
    def percent(self) -> int:
        if not self.max_score:
            return 0
        return round(self.score * 100 / self.max_score)


class Answer(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    chosen_option = models.PositiveSmallIntegerField(null=True, blank=True)
    text_answer = models.TextField(blank=True)
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ["question__order", "question_id"]
