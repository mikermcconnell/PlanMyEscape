# PlanMyEscape

A comprehensive camping trip planning application that helps you organize your gear, plan meals, and manage your budget for outdoor adventures.

## Features

- Meal Planning
- Packing List Management
- Gear Locker
- Trip Setup
- Budget Tracking

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm start`

## Technologies

- React
- TypeScript
- Tailwind CSS

## Features

### 🏕️ Trip Planning
- Create trips with start/end dates, group size, and location
- Support for car camping and backcountry trips
- Automatic day calculation and meal planning

### 📦 Packing Lists
- Pre-filled templates based on trip type (car vs backcountry)
- Categorized items (Shelter, Kitchen, Clothing, etc.)
- Checkable items with progress tracking
- Weight tracking for backcountry trips
- Add, edit, and delete custom items

### 🍽️ Meal Planning
- Daily meal calendar (breakfast, lunch, dinner, snacks)
- Pre-built meal templates with ingredients
- Automatic shopping list generation
- Combine ingredients efficiently

### 🎒 Gear Locker
- Personal gear inventory management
- Assign gear to specific trips
- Weight tracking and notes
- Categorized organization

### 📱 Responsive Design
- Works on desktop, tablet, and mobile
- Dark mode support
- Clean, modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Storage**: Local Storage (ready for backend integration)
- **Build**: Create React App

## Project Structure

```
src/
├── components/
│   └── layout/
│       └── Layout.tsx          # Main layout with navigation
├── pages/
│   ├── Dashboard.tsx           # Trip overview and management
│   ├── TripSetup.tsx           # Create new trips
│   ├── PackingList.tsx         # Packing list management
│   ├── MealPlanner.tsx         # Meal planning and shopping
│   └── GearLocker.tsx          # Personal gear inventory
├── data/
│   ├── packingTemplates.ts     # Pre-built packing lists
│   └── mealTemplates.ts        # Meal templates and ingredients
├── types/
│   └── index.ts               # TypeScript type definitions
├── utils/
│   └── storage.ts             # Local storage utilities
└── App.tsx                    # Main app with routing
```

## Data Storage

Currently uses browser localStorage for data persistence. Data structure:

- **Trips**: Basic trip information
- **Packing Lists**: Items per trip with check status
- **Meals**: Meal plans per trip
- **Gear**: Personal gear inventory with trip assignments

## Future Enhancements

- [ ] User authentication and cloud sync
- [ ] Offline functionality with service workers
- [ ] Weather integration
- [ ] Trip sharing and collaboration
- [ ] Export to PDF/print
- [ ] Mobile app (React Native)
- [ ] Backend API with database
- [ ] Real-time collaboration
- [ ] Gear recommendations
- [ ] Cost tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues, please open a GitHub issue or contact the development team.

---

Built with ❤️ for the camping community 