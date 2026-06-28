export const INDUSTRY_SEGMENTS = [
  { value: "restaurants_cafes", label: "Restaurants & Cafes" },
  { value: "beauty_salon", label: "Beauty & Salon" },
  { value: "healthcare_medical", label: "Healthcare & Medical" },
  { value: "travel_hospitality", label: "Travel & Hospitality" },
  { value: "fitness_gym", label: "Fitness & Gym" },
  { value: "events_entertainment", label: "Events & Entertainment" },
  { value: "education_training", label: "Education & Training" },
];

export const SUB_INDUSTRIES: Record<string, string[]> = {
  restaurants_cafes: ["Restaurants", "Cafes", "Fast Food", "Fine Dining", "Bakeries", "Cloud Kitchens", "Juice Bars", "Tea Shops"],
  beauty_salon: ["Hair Salons", "Beauty Parlours", "Nail Studios", "Makeup Artists", "Spa & Wellness", "Skincare Clinics", "Barber Shops"],
  healthcare_medical: ["Clinics", "Hospitals", "Dentists", "Physiotherapy", "Diagnostic Centers", "Eye Clinics", "Mental Wellness Centers"],
  travel_hospitality: ["Hotels", "Resorts", "Travel Agencies", "Tour Operators", "Homestays", "Car Rentals"],
  fitness_gym: ["Gyms", "Yoga Studios", "CrossFit Centers", "Personal Trainers", "Dance Studios", "Martial Arts Academies"],
  events_entertainment: ["Event Planners", "Wedding Planners", "Photography Studios", "DJs", "Event Decorators"],
  education_training: ["Coaching Institutes", "Schools", "Colleges", "Online Courses", "Skill Training Centers", "Tuition Classes", "Music Academies"],
};
