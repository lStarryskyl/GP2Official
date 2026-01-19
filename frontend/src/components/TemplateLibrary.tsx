import React, { useState } from 'react';
import { FileText, Star, Download, Search, Filter, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  tags: string[];
  usage_count: number;
  rating: number;
  rating_count: number;
}

interface TemplateLibraryProps {
  templates: Template[];
  onUseTemplate: (templateId: string) => void;
  onRateTemplate: (templateId: string, rating: number) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates,
  onUseTemplate,
  onRateTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const categories = ['all', ...new Set(templates.map(t => t.category))];
  const industries = ['all', ...new Set(templates.map(t => t.industry))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesIndustry = selectedIndustry === 'all' || template.industry === selectedIndustry;
    return matchesSearch && matchesCategory && matchesIndustry;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-acorn-orange-500 text-acorn-orange-500' : 'text-acorn-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-acorn-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-acorn-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-acorn-blue-600" />
            <h2 className="text-2xl font-bold text-acorn-gray-900">Template Library</h2>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-acorn-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-acorn-gray-300 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-acorn-gray-300 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-4 py-2 border border-acorn-gray-300 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500"
          >
            {industries.map(ind => (
              <option key={ind} value={ind}>
                {ind === 'all' ? 'All Industries' : ind.charAt(0).toUpperCase() + ind.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="p-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-acorn-gray-400 mx-auto mb-4" />
            <p className="text-acorn-gray-600">No templates found matching your criteria</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-acorn-gray-200 rounded-lg p-6 hover:shadow-acorn transition-all hover:border-acorn-blue-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-acorn-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-acorn-gray-600 line-clamp-2">{template.description}</p>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    {renderStars(template.rating)}
                    <span className="text-acorn-gray-600 ml-1">({template.rating_count})</span>
                  </div>
                  <div className="flex items-center gap-1 text-acorn-gray-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>{template.usage_count} uses</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-acorn-blue-100 text-acorn-blue-700 rounded text-xs font-medium">
                    {template.category}
                  </span>
                  <span className="px-2 py-1 bg-acorn-orange-100 text-acorn-orange-700 rounded text-xs font-medium">
                    {template.industry}
                  </span>
                  {template.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-acorn-gray-100 text-acorn-gray-700 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => onUseTemplate(template.id)}
                    className="flex-1 bg-acorn-blue-500 hover:bg-acorn-blue-600 text-white"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
