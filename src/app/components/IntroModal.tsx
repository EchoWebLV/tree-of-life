'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';

interface TutorialSlide {
  title: string;
  videoUrl: string;
  description: string;
}

interface IntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tutorials: TutorialSlide[] = [
  {
    title: "Create Your AI Agent",
    videoUrl: "https://drive.google.com/file/d/1LhmV81CCjEFV_CfIc2ir9AAsIp3A6SYX/preview",
    description: "Learn how to create and customize your own AI agent in just a few steps."
  },
  {
    title: "Connect Your Agent To X",
    videoUrl: "https://drive.google.com/file/d/1TpffEIw_ORFj9YF1vvovvV2RdpkfnAlD/preview",
    description: "Understand how to connect your agent to a X account."
  },
];

export default function IntroModal({ isOpen, onClose }: IntroModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Reset to first slide when modal opens
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % tutorials.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + tutorials.length) % tutorials.length);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-black/70 rounded-xl p-6 max-w-3xl w-full">
          <Dialog.Title className="text-2xl font-bold text-center mb-4 text-white">
            {tutorials[currentSlide].title}
          </Dialog.Title>
          
          <div className="relative aspect-video mb-4 rounded-lg overflow-hidden">
            <iframe
              src={tutorials[currentSlide].videoUrl}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full absolute inset-0"
              style={{ border: 'none' }}
            />
          </div>

          <p className="text-center text-gray-300 mb-6">
            {tutorials[currentSlide].description}
          </p>

          <div className="flex justify-between items-center">
            <button
              onClick={prevSlide}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white"
            >
              Previous
            </button>

            <div className="flex gap-2">
              {tutorials.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    currentSlide === index ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            {currentSlide === tutorials.length - 1 ? (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white"
              >
                Get Started
              </button>
            ) : (
              <button
                onClick={nextSlide}
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white"
              >
                Next
              </button>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 