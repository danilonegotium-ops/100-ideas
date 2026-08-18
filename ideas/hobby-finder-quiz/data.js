// Content data for the Hobby Finder Quiz: the questions asked and a curated
// list of real hobbies, each tagged along the same dimensions the quiz measures.
// Dimensions: budget (low/medium/high), setting (indoor/outdoor/both),
// social (solo/social/both), physicality (physical/mental/both),
// time (low/medium/high), style (creative/analytical/both).

var QUESTIONS = [
  {
    dim: "budget",
    prompt: "What's your budget for getting started with a new hobby?",
    options: [
      { label: "Free or nearly free", value: "low" },
      { label: "I can spend a moderate amount to get started ($20-100)", value: "medium" },
      { label: "I don't mind investing in good gear or lessons", value: "high" },
    ],
  },
  {
    dim: "setting",
    prompt: "Where would you rather spend your hobby time?",
    options: [
      { label: "Indoors", value: "indoor" },
      { label: "Outdoors", value: "outdoor" },
      { label: "No strong preference", value: "both" },
    ],
  },
  {
    dim: "social",
    prompt: "Do you want to do this alone or with other people?",
    options: [
      { label: "On my own", value: "solo" },
      { label: "With other people", value: "social" },
      { label: "Either is fine", value: "both" },
    ],
  },
  {
    dim: "physicality",
    prompt: "Would you rather use your hands/body or your mind?",
    options: [
      { label: "Hands-on and physical", value: "physical" },
      { label: "Mentally-focused", value: "mental" },
      { label: "A mix of both", value: "both" },
    ],
  },
  {
    dim: "time",
    prompt: "How much time can you realistically give it each week?",
    options: [
      { label: "Less than 2 hours", value: "low" },
      { label: "2-5 hours", value: "medium" },
      { label: "More than 5 hours", value: "high" },
    ],
  },
  {
    dim: "style",
    prompt: "Which sounds more appealing?",
    options: [
      { label: "Making or creating something", value: "creative" },
      { label: "Solving problems or thinking strategically", value: "analytical" },
      { label: "A bit of both", value: "both" },
    ],
  },
];

var HOBBIES = [
  {
    name: "Photography",
    blurb: "Learning to see and capture light with a camera, even just a phone.",
    tags: { budget: "medium", setting: "both", social: "both", physicality: "physical", time: "medium", style: "creative" },
  },
  {
    name: "Hiking",
    blurb: "Exploring trails at your own pace, with fitness and fresh air built in.",
    tags: { budget: "low", setting: "outdoor", social: "both", physicality: "physical", time: "medium", style: "both" },
  },
  {
    name: "Journaling",
    blurb: "A quiet, private habit of writing down thoughts, plans, or gratitude.",
    tags: { budget: "low", setting: "indoor", social: "solo", physicality: "mental", time: "low", style: "creative" },
  },
  {
    name: "Chess",
    blurb: "A lifelong game of pattern recognition and strategy, playable anywhere.",
    tags: { budget: "low", setting: "both", social: "both", physicality: "mental", time: "low", style: "analytical" },
  },
  {
    name: "Gardening",
    blurb: "Growing vegetables, herbs, or flowers — as small as a windowsill pot.",
    tags: { budget: "medium", setting: "outdoor", social: "solo", physicality: "physical", time: "medium", style: "both" },
  },
  {
    name: "Pottery",
    blurb: "Shaping clay on a wheel or by hand into mugs, bowls, and sculptures.",
    tags: { budget: "medium", setting: "indoor", social: "both", physicality: "physical", time: "medium", style: "creative" },
  },
  {
    name: "Rock Climbing",
    blurb: "Full-body problem solving on a wall, usually at an indoor gym to start.",
    tags: { budget: "medium", setting: "both", social: "social", physicality: "physical", time: "medium", style: "analytical" },
  },
  {
    name: "Birdwatching",
    blurb: "Slow, observational time outside, learning to spot and identify species.",
    tags: { budget: "low", setting: "outdoor", social: "both", physicality: "mental", time: "low", style: "analytical" },
  },
  {
    name: "Home Brewing",
    blurb: "Making your own beer, mead, or kombucha with a bit of kitchen chemistry.",
    tags: { budget: "high", setting: "indoor", social: "both", physicality: "mental", time: "medium", style: "analytical" },
  },
  {
    name: "Learning Guitar",
    blurb: "Building a physical and musical skill that keeps paying off for years.",
    tags: { budget: "medium", setting: "indoor", social: "solo", physicality: "mental", time: "high", style: "creative" },
  },
  {
    name: "Painting & Drawing",
    blurb: "Sketchbook or canvas — a low-pressure way to make something visual.",
    tags: { budget: "low", setting: "indoor", social: "solo", physicality: "mental", time: "medium", style: "creative" },
  },
  {
    name: "Running",
    blurb: "The simplest fitness hobby there is: shoes, a route, and a goal.",
    tags: { budget: "low", setting: "outdoor", social: "both", physicality: "physical", time: "medium", style: "both" },
  },
  {
    name: "Cooking & Baking",
    blurb: "Turning dinner or dessert into a creative project instead of a chore.",
    tags: { budget: "medium", setting: "indoor", social: "both", physicality: "physical", time: "medium", style: "creative" },
  },
  {
    name: "Board Game Nights",
    blurb: "Collecting and hosting strategy games with friends on a regular night.",
    tags: { budget: "medium", setting: "indoor", social: "social", physicality: "mental", time: "low", style: "analytical" },
  },
  {
    name: "Yoga",
    blurb: "A low-cost, low-impact practice for flexibility, strength, and calm.",
    tags: { budget: "low", setting: "both", social: "both", physicality: "physical", time: "low", style: "both" },
  },
  {
    name: "Woodworking",
    blurb: "Building real furniture and objects with tools, starting with small projects.",
    tags: { budget: "high", setting: "indoor", social: "solo", physicality: "physical", time: "high", style: "creative" },
  },
  {
    name: "Language Learning",
    blurb: "Unlocking travel, media, and conversations in a new language.",
    tags: { budget: "low", setting: "both", social: "both", physicality: "mental", time: "medium", style: "analytical" },
  },
  {
    name: "Coding Side Projects",
    blurb: "Building small apps, sites, or scripts purely because you want to.",
    tags: { budget: "low", setting: "indoor", social: "solo", physicality: "mental", time: "high", style: "analytical" },
  },
  {
    name: "Knitting & Crochet",
    blurb: "A portable, meditative craft that produces something wearable.",
    tags: { budget: "low", setting: "indoor", social: "both", physicality: "mental", time: "medium", style: "creative" },
  },
  {
    name: "Cycling",
    blurb: "Commute, explore, or train — as casual or as serious as you want.",
    tags: { budget: "medium", setting: "outdoor", social: "both", physicality: "physical", time: "medium", style: "both" },
  },
];
