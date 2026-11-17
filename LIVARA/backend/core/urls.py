from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import (
    RegisterView, MeView, ReportListCreateView, ReportDetailView,
    AcceptReportView, UpdateReportStatusView, DashboardStatsView
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("reports/", ReportListCreateView.as_view(), name="reports"),
    path("reports/<int:pk>/", ReportDetailView.as_view(), name="report-detail"),
    path("reports/<int:pk>/accept/", AcceptReportView.as_view(), name="accept-report"),
    path("reports/<int:pk>/status/", UpdateReportStatusView.as_view(), name="update-report-status"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]
