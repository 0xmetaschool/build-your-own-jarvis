"use client"
import React, { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState('');
  const [openAIResponse, setOpenAIResponse] = useState('');
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false);
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
    if (note) {
      try {
        // Simulating API call
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: note }),
        });
        const data = await response.json();
        setOpenAIResponse(data.response);
        speakResponse(data.response);
      } catch (error) {
        console.error('Error:', error);
        setOpenAIResponse('An error occurred while processing your request.');
      }
    }
  };

  const speakResponse = (text) => {
    if (speechSynthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesisRef.current.speak(utterance);
    }
  };

  return (
    <div>
      {hasMicrophoneAccess ? (
        <div>
          <button onClick={toggleListening}>
            {isListening ? 'Click me back when you stop speaking' : 'Click me and speak'}
          </button>
          <p>Your input: {note}</p>
          <p>Response: {openAIResponse}</p>
        </div>
      ) : (
        <p>Please grant microphone access to use this feature.</p>
      )}
    </div>
  );
}
