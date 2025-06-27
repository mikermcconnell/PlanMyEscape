import React from 'react';
import { packingTemplates, specializedGear, tripTypeDescriptions } from '../data/packingTemplates';
import { Trip, TripType } from '../types';

interface PackingListProps {
  trip: Trip;
}

const PackingList: React.FC<PackingListProps> = ({ trip }) => {
  const tripType = trip.tripType;
  const template = packingTemplates[tripType];
  const specialized = specializedGear[tripType];
  const description = tripTypeDescriptions[tripType];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Packing List for {tripType} Trip</h2>
      <p className="mb-4 text-gray-600">{description}</p>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Essential Items:</h3>
        <ul className="list-disc pl-5">
          {template.essentials.map((item, index) => (
            <li key={index} className="mb-1">{item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Recommended Items:</h3>
        <ul className="list-disc pl-5">
          {template.recommended.map((item, index) => (
            <li key={index} className="mb-1">{item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Specialized Gear:</h3>
        <ul className="list-disc pl-5">
          {specialized.map((item, index) => (
            <li key={index} className="mb-1">{item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <p className="text-sm text-blue-800">
          Remember to check weather conditions and specific campsite/cottage requirements before your trip.
          Adjust this list based on your group size and specific needs.
        </p>
      </div>
    </div>
  );
};

export default PackingList; 