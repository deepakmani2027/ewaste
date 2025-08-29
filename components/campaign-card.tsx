"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { CheckCheck, LogOut, Loader2 } from "lucide-react"
import { useAuth } from "./auth/auth-context"

// Define the shape of the campaign object
interface Campaign {
  id: string | number;
  name: string;
  department: string;
  participants: number;
  imageUrl: string;
  description: string;
}

export default function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { user, isAuthenticated } = useAuth();
  
  // State for UI interactivity
  const [isJoined, setIsJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(campaign.participants);
  
  // State to manage loading for this specific card
  const [isLoading, setIsLoading] = useState(true);

  // On component mount, check the database for the persisted "joined" state
  useEffect(() => {
    const checkJoinedStatus = async () => {
      // Only check if the user is logged in
      if (!isAuthenticated || !user?.email) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const res = await fetch(`/api/campaigns?userEmail=${encodeURIComponent(user.email)}&campaignId=${campaign.id}`);
        const data = await res.json();
        if (res.ok) {
          setIsJoined(data.isJoined);
        }
      } catch (error) {
        console.error("Failed to check campaign status:", error);
        // Keep the button enabled even if the check fails
      } finally {
        setIsLoading(false);
      }
    };
    checkJoinedStatus();
  }, [user, isAuthenticated, campaign.id]);

  // This handler makes API calls to join or leave a campaign
  const handleToggleJoin = async () => {
    if (!isAuthenticated || !user?.email) {
      alert("You must be logged in to join a campaign.");
      return;
    }

    const newJoinedState = !isJoined;
    
    // Optimistically update the UI for a responsive feel
    setIsJoined(newJoinedState);
    setParticipantCount(prev => newJoinedState ? prev + 1 : prev - 1);
    setIsLoading(true); // Disable button during API call

    try {
      const method = newJoinedState ? 'POST' : 'DELETE';
      const response = await fetch('/api/campaigns', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, campaignId: campaign.id }),
      });

      if (!response.ok) {
        // If the API call fails, revert the UI changes
        setIsJoined(!newJoinedState);
        setParticipantCount(prev => !newJoinedState ? prev + 1 : prev - 1);
        alert("An error occurred. Please try again.");
      }
    } catch (error) {
        // Revert on network error
        setIsJoined(!newJoinedState);
        setParticipantCount(prev => !newJoinedState ? prev + 1 : prev - 1);
        alert("A network error occurred. Please try again.");
    } finally {
        setIsLoading(false); // Re-enable button
    }
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="overflow-hidden">
        <Image
          src={campaign.imageUrl}
          alt={campaign.name}
          width={600}
          height={400}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{campaign.name}</h3>
        <p className="text-sm text-muted-foreground mb-4 flex-1">{campaign.description}</p>
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <span>{participantCount} Participants</span>
          <Button 
            size="sm" 
            onClick={handleToggleJoin}
            variant={isJoined ? "outline" : "default"}
            className={isJoined ? "text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700" : ""}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isJoined ? (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Leave
              </>
            ) : (
              "Join"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
