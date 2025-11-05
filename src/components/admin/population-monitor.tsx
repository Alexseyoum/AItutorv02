// File: src/components/admin/population-monitor.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Play,
  Pause,
  RotateCcw,
  BarChart
} from "lucide-react";
import { toast } from "sonner";

interface PopulationStats {
  totalGenerated: number;
  totalStored: number;
  errors: number;
  currentStatus: "idle" | "running" | "paused" | "completed";
  currentTopic?: string;
  progress?: number;
}

export default function PopulationMonitor() {
  const [stats, setStats] = useState<PopulationStats>({
    totalGenerated: 0,
    totalStored: 0,
    errors: 0,
    currentStatus: "idle"
  });
  const [topics, setTopics] = useState("");
  const [questionsPerTopic, setQuestionsPerTopic] = useState(10);
  const [isRunning, setIsRunning] = useState(false);

  const startPopulation = async () => {
    if (!topics.trim()) {
      toast.error("Please enter topics to populate");
      return;
    }

    try {
      setIsRunning(true);
      setStats(prev => ({ ...prev, currentStatus: "running" }));
      
      toast.promise(
        fetch("/api/question-bank/generate-batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topics: topics.split("\n").map(line => {
              const [subject, topic] = line.split(":").map(s => s.trim());
              return { subject, topic, count: questionsPerTopic };
            }),
            countPerTopic: questionsPerTopic
          })
        }),
        {
          loading: "Starting population process...",
          success: "Population process completed successfully",
          error: "Failed to start population process"
        }
      );
    } catch (error) {
      console.error("Error starting population:", error);
      toast.error("Failed to start population process");
      setIsRunning(false);
    }
  };

  const pausePopulation = () => {
    setIsRunning(false);
    setStats(prev => ({ ...prev, currentStatus: "paused" }));
    toast.info("Population process paused");
  };

  const resetStats = () => {
    setStats({
      totalGenerated: 0,
      totalStored: 0,
      errors: 0,
      currentStatus: "idle"
    });
    toast.info("Statistics reset");
  };

  const sampleTopics = `Math: Algebra: Linear Equations
Math: Algebra: Systems of Equations
Math: Geometry: Triangles
Math: Geometry: Circles
Reading: Reading Comprehension: Literature
Reading: Reading Comprehension: History
Writing: Standard English Conventions: Grammar`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Bank Population</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Configuration */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="topics">Topics (one per line, format: Subject: Topic)</Label>
                <textarea
                  id="topics"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base transition-all duration-150 ease-out placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-300 dark:hover:border-gray-500 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground selection:bg-primary selection:text-primary-foreground w-full min-h-[120px]"
                  placeholder="Math: Algebra: Linear Equations&#10;Math: Geometry: Triangles&#10;Reading: Reading Comprehension: Literature"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setTopics(sampleTopics)}
                >
                  Load Sample Topics
                </Button>
              </div>
              
              <div>
                <Label htmlFor="questionsPerTopic">Questions per Topic</Label>
                <Input
                  id="questionsPerTopic"
                  type="number"
                  min="1"
                  max="50"
                  value={questionsPerTopic}
                  onChange={(e) => setQuestionsPerTopic(parseInt(e.target.value) || 10)}
                  className="w-32"
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            {isRunning ? (
              <Button onClick={pausePopulation} variant="destructive">
                <Pause className="h-4 w-4 mr-2" />
                Pause Population
              </Button>
            ) : (
              <Button onClick={startPopulation}>
                <Play className="h-4 w-4 mr-2" />
                Start Population
              </Button>
            )}
            <Button onClick={resetStats} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Stats
            </Button>
            <Button variant="outline">
              <BarChart className="h-4 w-4 mr-2" />
              View Detailed Stats
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.totalGenerated}</div>
                <p className="text-sm text-gray-500">Generated</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.totalStored}</div>
                <p className="text-sm text-gray-500">Stored</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.errors}</div>
                <p className="text-sm text-gray-500">Errors</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold capitalize">{stats.currentStatus}</div>
                <p className="text-sm text-gray-500">Status</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          {stats.currentStatus !== "idle" && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Current Progress</h3>
              <div className="space-y-2">
                {stats.currentTopic && (
                  <p className="text-sm">Processing: {stats.currentTopic}</p>
                )}
                {stats.progress !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${stats.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}