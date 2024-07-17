'use client';

import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

type DateSelectorProps = {
  onDateChange: (date: Date | null) => void;
};

export default function DateSelector({ onDateChange }: DateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setIsOpen(false);
    onDateChange(date);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center" ref={ref}>
      <p
        className="text-5xl font-bold mb-5 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'Select a date'}
      </p>
      {isOpen && (
        <div className="absolute top-16 z-50">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            inline
            maxDate={new Date()}
          />
        </div>
      )}
    </div>
  );
}