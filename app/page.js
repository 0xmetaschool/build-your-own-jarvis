"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';
import Lottie from 'lottie-react';
import holographicPersonAnimation from './holo_animation.json';
import clickSound from './button-click.mp3';

const CircularButton = ({ onClick, children, isActive }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(clickSound);
  }, []);

  const handleClick = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => console.error("Audio playback failed:", error));
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out
                  relative overflow-hidden
                  ${isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-transparent border-2 border-blue-500 text-blue-500'}
                  hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
    >
      <div className="relative z-10">
        {children}
      </div>
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition-opacity duration-300 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
      <div className="absolute inset-0 bg-grid bg-repeat bg-center opacity-20"></div>
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
  const [noteOpacity, setNoteOpacity] = useState(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition && !recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          setNoteOpacity(1);
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

  console.log(note);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      handleSpeechEnd(); // Call handleSpeechEnd when the user stops listening
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
      }
    }
  };


  const speakResponse = (text) => {
    if (speechSynthesisRef.current) {
      // Replace line breaks with spaces
      const formattedText = text.replace(/\n/g, ' ');
      
      const utterance = new SpeechSynthesisUtterance(formattedText);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.voice = speechSynthesisRef.current.getVoices().find(voice => voice.name === 'Google UK English Male') || speechSynthesisRef.current.getVoices()[0];

      // Set isAssistantSpeaking to true and clear the note when the speech starts
      utterance.onstart = () => {
        setIsAssistantSpeaking(true);
        setNoteOpacity(0);
        setTimeout(() => {
          setNote('');
        }, 500);
      };

      // Set isAssistantSpeaking to true on each word boundary
      utterance.onboundary = () => {
        setIsAssistantSpeaking(true);
      };

      // Set isAssistantSpeaking to false when the speech ends
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
        <div className="relative w-[85%] flex justify-center items-center mb-2">
          <Lottie 
            animationData={holographicPersonAnimation}
            loop={true}
            autoplay={true}
            style={{ 
              width: '70%', 
              height: '70%',
              opacity: isAssistantSpeaking ? 1 : 0.7,
              transition: 'opacity 0.5s ease-in-out',
            }}
            className={`lottie-animation ${isListening ? 'brightness-100' : isAssistantSpeaking ? 'brightness-150' : 'brightness-50' }`}
          />
        </div>

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
          <p 
            className="text-xl text-blue-300 transition-opacity duration-500" 
            style={{ opacity: noteOpacity }}
          >
            {note || "Speak to interact with JARVIS..."}
          </p>
        </div>
      </div>
    </div>
  );
}
