# CampMe - Camping Trip Planner

A modern, responsive web app for planning camping trips. Built for both car camping and backcountry adventures.

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

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CampMe
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Trip
1. Click "New Trip" on the dashboard
2. Select trip type (car camping or backcountry)
3. Set start and end dates
4. Enter group size and park/location name
5. Click "Create Trip"

### Packing List
- Automatically loads with template items based on trip type
- Check off items as you pack them
- Add custom items with categories
- View progress and total weight

### Meal Planning
- Add meals to each day of your trip
- Choose from pre-built templates
- View combined shopping list
- Plan efficiently with ingredient reuse

### Gear Management
- Add your personal gear to the locker
- Assign gear to specific trips
- Track weights and add notes
- Organize by categories

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