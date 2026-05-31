export interface ExampleText {
  id: string;
  title: string;
  category: string;
  icon: string;
  content: string;
}

export const exampleTexts: ExampleText[] = [
  {
    id: "presidential",
    title: "总统演讲",
    category: "演讲",
    icon: "🎙️",
    content:
      "Fellow citizens of the world, we stand at a crossroads of history. The challenges we face are unprecedented, but so too is our capacity to overcome them. Together, we have weathered storms that threatened to tear our nation apart, and together we have emerged stronger. The promise of tomorrow lies not in the hands of a few, but in the collective determination of the many. We must reaffirm our commitment to justice, equality, and the enduring pursuit of a more perfect union. Let us not be divided by our differences, but united by our shared aspirations. The road ahead requires courage, compassion, and an unwavering belief in the fundamental goodness of our people.",
  },
  {
    id: "technical",
    title: "技术文档",
    category: "技术",
    icon: "💻",
    content:
      "The implementation utilizes a distributed architecture comprising microservices orchestrated through a containerization platform. Each service communicates via RESTful API endpoints secured with OAuth 2.0 authentication protocols. The database layer employs a polyglot persistence strategy, leveraging relational databases for transactional consistency and document stores for flexible schema requirements. Performance optimization is achieved through multi-level caching mechanisms, including in-memory caches and content delivery networks. Monitoring and observability are facilitated through centralized logging aggregation and distributed tracing instrumentation across all service boundaries.",
  },
  {
    id: "children",
    title: "儿童读物",
    category: "文学",
    icon: "📖",
    content:
      "Once upon a time, there was a little rabbit named Rosie. She lived in a warm, cozy burrow under a big oak tree. Every morning, Rosie would hop out to see the sun. She loved to play in the green grass and chase the yellow butterflies. One day, she found a shiny red apple on the ground. It was the best apple she had ever tasted. Rosie was so happy that she did a little dance. All her friends came to see what was going on. They shared the apple and laughed together in the warm sun.",
  },
  {
    id: "news",
    title: "新闻报道",
    category: "新闻",
    icon: "📰",
    content:
      "The federal government announced a comprehensive infrastructure spending package totaling approximately two trillion dollars on Thursday. The legislation allocates substantial funding toward transportation modernization, broadband network expansion, and municipal water system improvements across all fifty states. Economic analysts suggest the investment could generate significant employment opportunities within the construction and technology sectors over the next decade. Congressional representatives from both parties expressed cautious optimism regarding the bipartisan potential of the proposal, though disagreements remain regarding specific funding mechanisms and regulatory oversight provisions.",
  },
  {
    id: "academic",
    title: "学术论文",
    category: "学术",
    icon: "🎓",
    content:
      "The epistemological ramifications of quantum entanglement necessitate a fundamental reassessment of conventional ontological frameworks. Notwithstanding the phenomenological observations corroborating non-locality, the conceptual implications remain contentious within the philosophical community. Methodological considerations pertaining to measurement perturbation invariably complicate the interpretation of experimental outcomes, thereby engendering persistent ambiguities in the theoretical explication of superposition phenomena. Consequently, interdisciplinary collaboration between theoretical physicists and metaphysicians becomes indispensable for the comprehensive elucidation of these paradoxical conceptualizations that transcend traditional disciplinary boundaries.",
  },
];
