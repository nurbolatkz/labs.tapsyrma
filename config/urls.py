from django.urls import include, path

urlpatterns = [
    path("", include("labs.urls")),
]
