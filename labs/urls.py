from django.urls import path

from . import views

app_name = "labs"

urlpatterns = [
    # public
    path("", views.home, name="home"),
    path("s/", views.session_enter, name="session_enter"),
    path("s/<str:code>/", views.session_start, name="session_start"),
    path("s/<str:code>/jumys/", views.session_work, name="session_work"),
    path("s/<str:code>/natije/<int:submission_id>/", views.session_result, name="session_result"),

    # teacher auth
    path("mugalim/tirkelu/", views.teacher_register, name="teacher_register"),
    path("mugalim/kiru/", views.teacher_login, name="teacher_login"),
    path("mugalim/shygu/", views.teacher_logout, name="teacher_logout"),

    # teacher pages
    path("mugalim/", views.teacher_dashboard, name="teacher_dashboard"),
    path("mugalim/zertkana/jana/", views.teacher_lab_new, name="teacher_lab_new"),
    path("mugalim/zertkana/<int:lab_id>/", views.teacher_lab_edit, name="teacher_lab_edit"),
    path("mugalim/zertkana/<int:lab_id>/zhoyu/", views.teacher_lab_delete, name="teacher_lab_delete"),

    path("mugalim/sabaq/", views.teacher_sessions, name="teacher_sessions"),
    path("mugalim/sabaq/jana/", views.teacher_session_new, name="teacher_session_new"),
    path("mugalim/sabaq/<str:code>/", views.teacher_session_detail, name="teacher_session_detail"),
    path("mugalim/sabaq/<str:code>/jany/", views.teacher_session_toggle, name="teacher_session_toggle"),
    path("mugalim/sabaq/<str:code>/zhoyu/", views.teacher_session_delete, name="teacher_session_delete"),

    path("mugalim/esep/", views.teacher_reports, name="teacher_reports"),
    path("mugalim/esep/zhauap/<int:submission_id>/", views.teacher_submission_detail, name="teacher_submission_detail"),
    path("mugalim/esep/csv/", views.teacher_reports_csv, name="teacher_reports_csv"),
]
