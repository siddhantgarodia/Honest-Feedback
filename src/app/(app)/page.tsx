"use client";

import React, { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import messages from "@/messages.json";

const Home = () => {
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSendMessage = () => {
    if (!username || username.trim() === "") {
      setError("Please enter a username");
      return;
    }

    setError("");
    window.location.href = `/u/${encodeURIComponent(username.trim())}`;
  };

  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4 py-8 transition-colors">
        <section className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold mb-4 transition-colors">
            Welcome to Honest-Feedback
          </h1>
          <p className="text-lg mb-6 text-muted-foreground transition-colors">
            Honest-Feedback is a platform for sharing and receiving anonymous
            feedback. Connect with others and improve through honest insights.
          </p>

          <div className="mt-4 flex justify-center flex-col items-center">
            {!showUsernameInput ? (
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                onClick={() => setShowUsernameInput(true)}
              >
                <MessageCircle size={18} />
                Share Honest Feedback
              </Button>
            ) : (
              <div className="bg-card p-4 rounded-lg border border-border shadow-md w-full max-w-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Share Honest Feedback</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setShowUsernameInput(false);
                      setUsername("");
                      setError("");
                    }}
                  >
                    <X size={16} />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Input
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={error ? "border-red-500" : ""}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendMessage();
                      }}
                    />
                    {error && (
                      <p className="text-xs text-red-500 mt-1">{error}</p>
                    )}
                  </div>
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={handleSendMessage}
                  >
                    <MessageCircle size={16} className="mr-2" />
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="mt-12 w-full max-w-md">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
          >
            <CarouselContent>
              {messages.map((message, index) => (
                <CarouselItem key={index} className="flex justify-center">
                  <Card className="w-full shadow-md bg-card text-card-foreground transition-colors">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-2">
                        {message.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {message.content}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </main>
    </>
  );
};

export default Home;
