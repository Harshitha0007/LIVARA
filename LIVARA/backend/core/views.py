from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Report
from .serializers import RegisterSerializer, UserSerializer, ReportSerializer
from .permissions import CanViewAndCreateReports, IsResponder, profile_for

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [CanViewAndCreateReports]

    def get_queryset(self):
        qs = Report.objects.select_related("created_by", "assigned_to").all()
        category = self.request.query_params.get("category")
        state = self.request.query_params.get("status")
        mine = self.request.query_params.get("mine")
        if category:
            qs = qs.filter(category=category)
        if state:
            qs = qs.filter(status=state)
        if mine == "true" and self.request.user.is_authenticated:
            qs = qs.filter(Q(created_by=self.request.user) | Q(assigned_to=self.request.user))
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ReportDetailView(generics.RetrieveAPIView):
    queryset = Report.objects.select_related("created_by", "assigned_to").all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.AllowAny]

class AcceptReportView(APIView):
    permission_classes = [IsAuthenticated, IsResponder]

    def post(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({"detail": "Report not found."}, status=404)
        if report.status != "open":
            return Response({"detail": "This report is no longer open."}, status=400)
        report.assigned_to = request.user
        report.status = "accepted"
        report.save()
        return Response(ReportSerializer(report, context={"request": request}).data)

class UpdateReportStatusView(APIView):
    permission_classes = [IsAuthenticated, IsResponder]

    def patch(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({"detail": "Report not found."}, status=404)
        if not request.user.is_staff and report.assigned_to_id != request.user.id:
            return Response({"detail": "Only the assigned responder or admin can update this report."}, status=403)
        new_status = request.data.get("status")
        allowed = ["in_progress", "resolved", "rejected"]
        if new_status not in allowed:
            return Response({"detail": "Status must be in_progress, resolved or rejected."}, status=400)
        report.status = new_status
        report.save()
        return Response(ReportSerializer(report, context={"request": request}).data)

class DashboardStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        data = {
            "total": Report.objects.count(),
            "open": Report.objects.filter(status="open").count(),
            "in_progress": Report.objects.filter(status__in=["accepted", "in_progress"]).count(),
            "resolved": Report.objects.filter(status="resolved").count(),
            "animal_reports": Report.objects.filter(category="animal_rescue").count(),
        }
        return Response(data)
