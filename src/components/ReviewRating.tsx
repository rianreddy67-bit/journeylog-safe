import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Calendar, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  place: string;
  rating: number;
  review: string;
  date: string;
  location: string;
}

interface ReviewRatingProps {
  place?: string;
  location?: string;
  onReviewSubmit?: (review: Review) => void;
}

const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-6 w-6 cursor-pointer transition-colors ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
          }`}
          onClick={() => onRatingChange(star)}
        />
      ))}
    </div>
  );
};

export function ReviewRating({ place = "Golden Triangle Tour", location = "Delhi • Agra • Jaipur", onReviewSubmit }: ReviewRatingProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const { toast } = useToast();

  // Load reviews from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tourSafeReviews');
    if (saved) {
      setReviews(JSON.parse(saved));
    }
  }, []);

  // Save reviews to localStorage
  useEffect(() => {
    localStorage.setItem('tourSafeReviews', JSON.stringify(reviews));
  }, [reviews]);

  const submitReview = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive"
      });
      return;
    }

    if (!reviewText.trim()) {
      toast({
        title: "Review Required",
        description: "Please write a review",
        variant: "destructive"
      });
      return;
    }

    const newReview: Review = {
      id: Date.now().toString(),
      place,
      rating,
      review: reviewText.trim(),
      date: new Date().toLocaleDateString(),
      location
    };

    setReviews(prev => [newReview, ...prev]);
    onReviewSubmit?.(newReview);
    
    setRating(0);
    setReviewText("");
    
    toast({
      title: "⭐ Review Submitted",
      description: `Thank you for rating ${place}!`,
    });
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Add Review */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Rate Your Experience
          </CardTitle>
          <CardDescription>Share your thoughts about {place}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Rating</label>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Review</label>
            <Textarea
              placeholder="Share your experience, tips, and recommendations..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <Button onClick={submitReview} className="w-full" variant="gradient">
            Submit Review
          </Button>
        </CardContent>
      </Card>

      {/* Reviews Overview */}
      {reviews.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Reviews & Ratings
              </span>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Anonymous Traveler</span>
                        <Badge variant="outline" className="text-xs">
                          Verified
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{review.location}</span>
                        <Calendar className="h-3 w-3 ml-2" />
                        <span>{review.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{review.review}</p>
                </div>
              ))}
              
              {reviews.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline">
                    View All {reviews.length} Reviews
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}