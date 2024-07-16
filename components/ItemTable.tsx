'use client';

import React from 'react';

type Item = {
  title: string;
  link: string;
};

type ItemTableProps = {
  items: Item[];
};

export default function ItemTable({ items }: ItemTableProps) {  
  return (
    <table className="min-w-full bg-white rounded-lg shadow-md">
      <thead>
        <tr>
          <th className="border px-4 py-2">Title with Link</th>
        </tr>
      </thead>
      <tbody>
        {items.length > 0 ? (
          items.map((item, index) => (
            <tr
              key={index}
              onClick={() => window.open(item.link, '_blank')}
              className="cursor-pointer hover:bg-gray-200"
            >
              <td className="border px-4 py-2 text-blue-500 underline">
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td className="border px-4 py-2">No items available</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}