// File: src/components/admin/quality-control-workflow.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Play,
  Pause
} from "lucide-react";
import { toast } from "sonner";

interface QCStats {
  pendingReview: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function QualityControlWorkflow() {
  const [stats, setStats] = useState<QCStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoReviewSpeed, setAutoReviewSpeed] = useState(5); // seconds

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/question-bank/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "getStats" })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Calculate QC stats from the returned data
        const qcStats: QCStats = {
          pendingReview: data.stats.statusCounts.find((s: any) => s.status === "PENDING_REVIEW")?._count._all || 0,
          approved: data.stats.statusCounts.find((s: any) => s.status === "APPROVED")?._count._all || 0,
          rejected: data.stats.statusCounts.find((s: any) => s.status === "REJECTED")?._count._all || 0,
          total: data.stats.totalQuestions
        };
        
        setStats(qcStats);
      }
    } catch (error) {
      console.error("Error fetching QC stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startAutoReview = () => {
    setIsAutoMode(true);
    // In a real implementation, this would start an automated review process
    toast.success("Auto review started");
  };

  const stopAutoReview = () => {
    setIsAutoMode(false);
    // In a real implementation, this would stop the automated review process
    toast.success("Auto review stopped");
  };

  const batchApprove = async () => {
    try {
      // In a real implementation, this would get selected question IDs and approve them
      toast.promise(
        fetch("/api/question-bank/manage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            action: "batchApprove",
            questionIds: [] // Would contain actual question IDs
          })
        }),
        {
          loading: "Approving questions...",
          success: "Questions approved successfully",
          error: "Failed to approve questions"
        }
      );
    } catch (error) {
      console.error("Error batch approving:", error);
      toast.error("Failed to approve questions");
    }
  };

  const batchReject = async () => {
    try {
      // In a real implementation, this would get selected question IDs and reject them
      toast.promise(
        fetch("/api/question-bank/manage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            action: "batchReject",
            questionIds: [] // Would contain actual question IDs
          })
        }),
        {
          loading: "Rejecting questions...",
          success: "Questions rejected successfully",
          error: "Failed to reject questions"
        }
      );
    } catch (error) {
      console.error("Error batch rejecting:", error);
      toast.error("Failed to reject questions");
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality Control Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats?.pendingReview || 0}</div>
                <p className="text-sm text-gray-500">Pending Review</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats?.approved || 0}</div>
                <p className="text-sm text-gray-500">Approved</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats?.rejected || 0}</div>
                <p className="text-sm text-gray-500">Rejected</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-sm text-gray-500">Total Questions</p>
              </CardContent>
            </Card>
          </div>

          {/* Auto Review Controls */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Auto Review</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="speed">Review Speed:</Label>
                <Input
                  id="speed"
                  type="number"
                  min="1"
                  max="60"
                  value={autoReviewSpeed}
                  onChange={(e) => setAutoReviewSpeed(parseInt(e.target.value) || 5)}
                  className="w-20"
                />
                <span>seconds</span>
              </div>
              
              <div className="flex gap-2">
                {isAutoMode ? (
                  <Button onClick={stopAutoReview} variant="destructive">
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Auto Review
                  </Button>
                ) : (
                  <Button onClick={startAutoReview}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Auto Review
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Auto review will automatically approve questions that meet quality criteria
            </p>
          </div>

          {/* Batch Actions */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Batch Actions</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={batchApprove} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Batch Approve Selected
              </Button>
              <Button onClick={batchReject} variant="destructive" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Batch Reject Selected
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Select questions in the review interface to perform batch actions
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}