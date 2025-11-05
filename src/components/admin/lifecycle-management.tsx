// File: src/components/admin/lifecycle-management.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Archive,
  RotateCcw,
  Eye
} from "lucide-react";
import { toast } from "sonner";

export default function LifecycleManagement() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRetireUnderperforming = async () => {
    try {
      setIsProcessing(true);
      
      const response = await fetch("/api/question-bank/lifecycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "retireUnderperforming" })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Retired ${data.stats.lowPerformance + data.stats.highUsage} questions`);
      } else {
        toast.error(data.message || "Failed to retire questions");
      }
    } catch (error) {
      console.error("Error retiring questions:", error);
      toast.error("Failed to retire questions");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveOld = async () => {
    try {
      setIsProcessing(true);
      
      const response = await fetch("/api/question-bank/lifecycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "archiveOld" })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Archived ${data.count} old questions`);
      } else {
        toast.error(data.message || "Failed to archive questions");
      }
    } catch (error) {
      console.error("Error archiving questions:", error);
      toast.error("Failed to archive questions");
    } finally {
      setIsProcessing(false);
    }
  };

  const viewRetiredQuestions = async () => {
    try {
      const response = await fetch("/api/question-bank/lifecycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "getByStage",
          status: "retired",
          limit: 10
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log("Retired questions:", data.questions);
        toast.info(`Found ${data.questions.length} retired questions (check console for details)`);
      } else {
        toast.error(data.message || "Failed to fetch retired questions");
      }
    } catch (error) {
      console.error("Error fetching retired questions:", error);
      toast.error("Failed to fetch retired questions");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Lifecycle Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Retire Underperforming Questions</h3>
            <p className="text-sm text-gray-500 mb-4">
              Automatically retire questions with low correct rates (&lt;30%) or very high usage counts (&gt;1000)
            </p>
            <Button 
              onClick={handleRetireUnderperforming}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retire Underperforming Questions
            </Button>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Archive Old Questions</h3>
            <p className="text-sm text-gray-500 mb-4">
              Archive questions that have been retired for over a year
            </p>
            <Button 
              onClick={handleArchiveOld}
              disabled={isProcessing}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive Old Questions
            </Button>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">View Retired Questions</h3>
            <p className="text-sm text-gray-500 mb-4">
              View questions that have been retired for review
            </p>
            <Button 
              onClick={viewRetiredQuestions}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Retired Questions
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}