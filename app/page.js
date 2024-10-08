"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';

const CircularButton = ({ onClick, children, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out
                  ${isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-transparent border-2 border-blue-500 text-blue-500'}
                  hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
    >
      {children}
    </button>
  );
};

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState('');
  const [openAIResponse, setOpenAIResponse] = useState('');
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition && !recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');
          setNote(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            console.log("Microphone access granted");
            setHasMicrophoneAccess(true);
          })
          .catch((err) => console.error("Error accessing microphone:", err));
      }

      speechSynthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      handleSpeechEnd();
    } else {
      setNote('');
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const handleSpeechEnd = async () => {
    if (isListening) {
      recognitionRef.current.stop();
    }
    if (note) {
      try {
        setIsAssistantSpeaking(true);
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: note }),
        });
        const data = await response.json();
        setOpenAIResponse(data.response);
        if (!isMuted) {
          speakResponse(data.response);
        }
      } catch (error) {
        console.error('Error:', error);
        setOpenAIResponse('An error occurred while processing your request.');
      } finally {
        setIsAssistantSpeaking(false);
      }
    }
  };

  const speakResponse = (text) => {
    if (speechSynthesisRef.current) {
      const formattedText = text.replace(/\n/g, ' ');
      
      const utterance = new SpeechSynthesisUtterance(formattedText);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.voice = speechSynthesisRef.current.getVoices().find(voice => voice.name === 'Google UK English Male') || speechSynthesisRef.current.getVoices()[0];

      utterance.onstart = () => {
        setIsAssistantSpeaking(true);
      };

      utterance.onend = () => {
        setIsAssistantSpeaking(false);
      };

      speechSynthesisRef.current.speak(utterance);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (speechSynthesisRef.current) {
      if (!isMuted) {
        speechSynthesisRef.current.cancel();
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-blue-400 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="flex justify-center space-x-3 mb-6">
          {hasMicrophoneAccess ? (
            <>
              <CircularButton onClick={toggleListening} isActive={isListening}>
                <Mic size={24} />
              </CircularButton>
              <CircularButton onClick={toggleMute} isActive={!isMuted}>
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </CircularButton>
            </>
          ) : (
            <p className="text-lg text-red-500">Please grant microphone access to use this feature.</p>
          )}
        </div>
        
        <div className="w-full text-center">
          <p className="text-xl text-blue-300">
            {note || "Speak to interact with the assistant..."}
          </p>
          {openAIResponse && (
            <p className="text-xl text-green-300 mt-4">
              Assistant: {openAIResponse}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
