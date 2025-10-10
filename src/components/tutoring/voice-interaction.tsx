// src/components/voice-interaction.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

interface VoiceInteractionProps {
  onVoiceInput?: (transcript: string) => void;
  onSpeakText?: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function VoiceInteraction({ 
  onVoiceInput, 
  onSpeakText,
  className = "",
  size = "sm"
}: VoiceInteractionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecog = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;
    
    if (SpeechRecog && speechSynthesis) {
      setIsSupported(true);
      speechSynthRef.current = speechSynthesis;
      
      // Initialize speech recognition
      const recognition = new SpeechRecog() as SpeechRecognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        toast.success("🎤 Listening... Speak now!");
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onVoiceInput) {
          onVoiceInput(transcript);
        }
        toast.success(`🎯 Heard: "${transcript}"`);
        setIsListening(false);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Web Speech API not supported');
      toast.error('Voice features not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, [onVoiceInput]);

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) {
      toast.error('Voice recognition not available');
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast.error('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const speakText = (text: string) => {
    if (!isSupported || !speechSynthRef.current) {
      toast.error('Text-to-speech not available');
      return;
    }

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      toast.error('Text-to-speech error');
      setIsSpeaking(false);
    };

    speechSynthRef.current.speak(utterance);
    
    if (onSpeakText) {
      onSpeakText(text);
    }
  };

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'sm';
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Voice Input Button */}
      <Button
        onClick={isListening ? stopListening : startListening}
        variant="outline"
        size={buttonSize}
        className={`
          transition-all duration-200 ${
          isListening 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30' 
            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
        disabled={isSpeaking}
      >
        {isListening ? (
          <>
            <MicOff className={`${iconSize} mr-1`} />
            Stop
          </>
        ) : (
          <>
            <Mic className={`${iconSize} mr-1`} />
            Voice
          </>
        )}
      </Button>

      {/* Text-to-Speech Button */}
      <Button
        onClick={isSpeaking ? stopSpeaking : () => speakText("Hello! I'm ready to help you learn.")}
        variant="outline"
        size={buttonSize}
        className={`
          transition-all duration-200 ${
          isSpeaking 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
        disabled={isListening}
      >
        {isSpeaking ? (
          <>
            <VolumeX className={`${iconSize} mr-1`} />
            Stop
          </>
        ) : (
          <>
            <Volume2 className={`${iconSize} mr-1`} />
            Speak
          </>
        )}
      </Button>
    </div>
  );
}
