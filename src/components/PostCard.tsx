import type { FC } from 'react';
import Image from 'next/image';

interface PostCardProps {
  category: string;
  title: string;
  description: string;
  date: string;
  imageUrl: string;
}

const PostCard: FC<PostCardProps> = ({ category, title, description, date, imageUrl }) => {
  return (
    <div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-700" data-category={category}>
      <div className="relative h-48 w-full">
        <Image src={imageUrl} alt={title} fill className="object-cover" unoptimized />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{description}</p>
        <span className="text-gray-500 dark:text-gray-400 text-xs">{date}</span>
      </div>
    </div>
  );
};

export default PostCard;
