from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from .models import Lab, LabSession, Question

User = get_user_model()


class StudentInfoForm(forms.Form):
    student_name = forms.CharField(
        label="Аты-жөні", max_length=120, widget=forms.TextInput(attrs={"autocomplete": "name"})
    )
    student_class = forms.CharField(
        label="Сыныбы",
        max_length=40,
        widget=forms.TextInput(attrs={"placeholder": "мысалы: 9-Ә"}),
    )
    student_school = forms.CharField(
        label="Мектебі",
        max_length=200,
        widget=forms.TextInput(attrs={"placeholder": "мектеп атауы, қала"}),
    )


class SessionCodeForm(forms.Form):
    code = forms.CharField(
        label="Сабақ коды",
        max_length=16,
        widget=forms.TextInput(
            attrs={"placeholder": "мысалы: a7k3m2p9", "autocapitalize": "off", "autocomplete": "off"}
        ),
    )

    def clean_code(self):
        return (self.cleaned_data["code"] or "").strip().lower()


class TeacherRegisterForm(forms.Form):
    full_name = forms.CharField(label="Аты-жөні", max_length=120)
    email = forms.EmailField(label="Email")
    password = forms.CharField(label="Құпиясөз", widget=forms.PasswordInput, min_length=8)
    password2 = forms.CharField(label="Құпиясөз (қайталау)", widget=forms.PasswordInput)

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(username=email).exists():
            raise ValidationError("Бұл email тіркелген. Кіріңіз.")
        return email

    def clean(self):
        data = super().clean()
        if data.get("password") and data.get("password2") and data["password"] != data["password2"]:
            raise ValidationError("Құпиясөздер сәйкес емес.")
        pw = data.get("password")
        if pw:
            try:
                validate_password(pw)
            except ValidationError as e:
                self.add_error("password", e)
        return data


class TeacherLoginForm(forms.Form):
    email = forms.EmailField(label="Email")
    password = forms.CharField(label="Құпиясөз", widget=forms.PasswordInput)


class LabForm(forms.ModelForm):
    class Meta:
        model = Lab
        fields = ["title", "slug", "description", "animation_html", "pass_threshold", "is_published"]
        widgets = {
            "animation_html": forms.Textarea(attrs={"rows": 14, "spellcheck": "false"}),
            "description": forms.TextInput(),
        }


class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ["order", "kind", "prompt", "options", "correct_option", "points"]
        widgets = {
            "prompt": forms.Textarea(attrs={"rows": 2}),
            "options": forms.Textarea(
                attrs={"rows": 3, "placeholder": '["Ядро", "Митохондрия", "Рибосома"]'}
            ),
        }


class SessionForm(forms.ModelForm):
    class Meta:
        model = LabSession
        fields = ["title", "lab", "is_active", "expires_at"]
        widgets = {
            "expires_at": forms.DateTimeInput(attrs={"type": "datetime-local"}),
        }

    def __init__(self, *args, teacher=None, **kwargs):
        super().__init__(*args, **kwargs)
        if teacher is not None:
            self.fields["lab"].queryset = Lab.objects.filter(created_by=teacher)
