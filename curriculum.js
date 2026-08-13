export const CURRICULUM = [
  {
    "id": "math-diagnostic",
    "title": "Math Detective Diagnostic",
    "domain": "Math",
    "week": 1,
    "prerequisite": null,
    "required": 0,
    "qs": [
      {
        "skill": "Percent",
        "q": "A backpack costs $80 and is discounted 25%. What is the new price?",
        "o": [
          "$20",
          "$55",
          "$60",
          "$65"
        ],
        "a": 2,
        "e": "25% of $80 is $20, so the new price is $60."
      },
      {
        "skill": "Linear Equations",
        "q": "Solve: 3x + 7 = 28",
        "o": [
          "5",
          "7",
          "9",
          "11"
        ],
        "a": 1,
        "e": "Subtract 7, then divide by 3: x = 7."
      },
      {
        "skill": "Rates",
        "q": "A car travels 180 miles in 3 hours at a constant speed. How far in 4.5 hours?",
        "o": [
          "240",
          "250",
          "270",
          "300"
        ],
        "a": 2,
        "e": "180 \u00f7 3 = 60 mph; 60 \u00d7 4.5 = 270."
      },
      {
        "skill": "Ratios",
        "q": "The ratio of girls to boys is 3:2 in a 40-student club. How many girls?",
        "o": [
          "16",
          "20",
          "24",
          "30"
        ],
        "a": 2,
        "e": "Five ratio parts make 40, so each part is 8. Three parts = 24."
      }
    ]
  },
  {
    "id": "reading-diagnostic",
    "title": "Evidence Detective Diagnostic",
    "domain": "Reading & Writing",
    "week": 1,
    "prerequisite": null,
    "required": 0,
    "qs": [
      {
        "skill": "Inference",
        "p": "Jamal checked the clock for the third time in five minutes. His backpack was zipped and his shoes were on. When headlights swept across the front window, he grabbed the backpack before anyone called his name.",
        "q": "What is the best inference?",
        "o": [
          "He forgot where he was going.",
          "He was eagerly waiting for someone to arrive.",
          "He planned to sleep.",
          "He disliked cars."
        ],
        "a": 1,
        "e": "Repeated clock-checking and being ready support that he was eagerly waiting."
      },
      {
        "skill": "Analysis",
        "p": "A town planted trees along several hot, unshaded sidewalks. Two summers later, shaded sections had lower surface temperatures than nearby unshaded sections. Residents also reported using the sidewalks more often in the afternoon.",
        "q": "Which conclusion is best supported?",
        "o": [
          "Trees caused every resident to walk more.",
          "Shade was associated with cooler sidewalks and more afternoon use.",
          "The town no longer had hot weather.",
          "Unshaded sidewalks were closed."
        ],
        "a": 1,
        "e": "That answer matches both findings without claiming more than the evidence shows."
      },
      {
        "skill": "Precision",
        "q": "Which sentence is most precise?",
        "o": [
          "The animal moved over there quickly.",
          "The frightened rabbit sprinted toward the bushes.",
          "The rabbit did something very fast.",
          "It went away."
        ],
        "a": 1,
        "e": "It identifies the subject, action, and direction specifically."
      },
      {
        "skill": "Writing Mechanics",
        "q": "Choose the best sentence.",
        "o": [
          "The students finished the experiment, they recorded their results.",
          "The students finished the experiment they recorded their results.",
          "The students finished the experiment and recorded their results.",
          "The students finishing the experiment recorded their results."
        ],
        "a": 2,
        "e": "The conjunction correctly joins the actions."
      }
    ]
  },
  {
    "id": "inference-foundations",
    "title": "Inference Foundations",
    "domain": "Reading & Writing",
    "week": 2,
    "prerequisite": "reading-diagnostic",
    "required": 0.75,
    "qs": [
      {
        "skill": "Inference",
        "p": "Priya placed a plant beside a window. Its leaves leaned toward the glass. She turned the pot around. Two days later, the leaves began bending in the opposite direction.",
        "q": "Which conclusion is best supported?",
        "o": [
          "The plant responds to light direction.",
          "The plant grows only on Thursdays.",
          "The window was open.",
          "Priya overwatered it."
        ],
        "a": 0,
        "e": "The leaves repeatedly move toward the window after the pot is turned."
      },
      {
        "skill": "Evidence",
        "p": "The library extended Saturday hours from noon to 6 p.m. Three months later, Saturday visits were up 28%, while weekday visits stayed about the same.",
        "q": "Which claim is directly supported?",
        "o": [
          "Longer Saturday hours were associated with more Saturday visits.",
          "The library should close weekdays.",
          "Every visitor preferred Saturdays.",
          "Population rose 28%."
        ],
        "a": 0,
        "e": "It is the only claim that stays within the evidence."
      }
    ]
  },
  {
    "id": "equations-foundations",
    "title": "Equation Foundations",
    "domain": "Math",
    "week": 2,
    "prerequisite": "math-diagnostic",
    "required": 0.75,
    "qs": [
      {
        "skill": "Linear Equations",
        "q": "Solve: 2x + 5 = 19",
        "o": [
          "6",
          "7",
          "8",
          "12"
        ],
        "a": 1,
        "e": "Subtract 5, then divide by 2: x = 7."
      },
      {
        "skill": "Modeling",
        "q": "Maya has $9 and earns $6 per hour. Which expression gives her total after h hours?",
        "o": [
          "9h+6",
          "6h+9",
          "15h",
          "6(h+9)"
        ],
        "a": 1,
        "e": "Start with 9 and add 6 for each hour: 6h + 9."
      }
    ]
  }
];
