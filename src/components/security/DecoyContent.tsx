import React from 'react';

const DecoyContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Article Explorer
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover fascinating articles from around the web
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "The Science of Sleep",
              excerpt: "Understanding the complex mechanisms behind our daily rest cycles and their impact on health.",
              category: "Health",
              readTime: "5 min read"
            },
            {
              title: "Quantum Computing Advances", 
              excerpt: "Recent breakthroughs in quantum technology are reshaping the future of computation.",
              category: "Technology",
              readTime: "8 min read"
            },
            {
              title: "Sustainable Agriculture",
              excerpt: "Innovative farming techniques that protect the environment while feeding the world.",
              category: "Environment", 
              readTime: "6 min read"
            },
            {
              title: "Ancient Civilizations",
              excerpt: "Archaeological discoveries revealing new insights into human history and culture.",
              category: "History",
              readTime: "7 min read"
            },
            {
              title: "Space Exploration",
              excerpt: "Latest missions and discoveries expanding our understanding of the cosmos.",
              category: "Science",
              readTime: "9 min read"
            },
            {
              title: "Digital Privacy",
              excerpt: "Protecting personal information in an increasingly connected world.",
              category: "Technology",
              readTime: "4 min read"
            }
          ].map((article, index) => (
            <div key={index} className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                  {article.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {article.readTime}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {article.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {article.excerpt}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Load More Articles
          </button>
        </div>
      </div>
    </div>
  );
};

export default DecoyContent;