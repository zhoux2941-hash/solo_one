FIBER_CATEGORIES = {
    '皮纸类': ['楮皮', '三桠', '雁皮', '桑皮', '皮纸'],
    '竹纸类': ['竹纸'],
    '麻纸类': ['麻纸'],
    '草纸类': ['稻草纸'],
    '其他': ['混合纤维']
}


def get_fiber_category(fiber_type):
    for category, types in FIBER_CATEGORIES.items():
        if fiber_type in types:
            return category
    return '其他'


class PaperRecommender:
    @staticmethod
    def calculate_fiber_type_match(target_type, paper_type):
        if target_type == paper_type:
            return 1.0
        
        target_category = get_fiber_category(target_type)
        paper_category = get_fiber_category(paper_type)
        
        if target_category == paper_category and target_category != '其他':
            return 0.6
        
        if target_category == '其他' or paper_category == '其他':
            return 0.3
        
        return 0.2

    @staticmethod
    def calculate_fiber_similarity(target_fibers, paper_fibers):
        if not target_fibers and not paper_fibers:
            return 1.0
        if not target_fibers or not paper_fibers:
            return 0.0
        
        target_dict = {fc['fiber_type']: fc['percentage'] for fc in target_fibers}
        paper_dict = {fc['fiber_type']: fc['percentage'] for fc in paper_fibers}
        
        all_target_types = list(target_dict.keys())
        all_paper_types = list(paper_dict.keys())
        
        if not all_target_types and not all_paper_types:
            return 0.5
        
        total_score = 0.0
        total_weight = 0.0
        
        for t_type, t_pct in target_dict.items():
            best_match_score = 0.0
            
            for p_type, p_pct in paper_dict.items():
                type_match = PaperRecommender.calculate_fiber_type_match(t_type, p_type)
                percentage_diff = abs(t_pct - p_pct)
                percentage_sim = max(0, 1 - percentage_diff / 100)
                
                combined = type_match * 0.7 + percentage_sim * 0.3
                
                if combined > best_match_score:
                    best_match_score = combined
            
            total_score += best_match_score * t_pct
            total_weight += t_pct
        
        if total_weight > 0:
            return total_score / total_weight
        
        return 0.2

    @staticmethod
    def calculate_thickness_similarity(target_thickness, paper_thickness):
        if target_thickness <= 0 or paper_thickness <= 0:
            return 0.0
        if target_thickness == paper_thickness:
            return 1.0
        
        diff = abs(target_thickness - paper_thickness)
        max_val = max(target_thickness, paper_thickness)
        return 1 - (diff / max_val)

    @staticmethod
    def calculate_ph_similarity(target_ph, paper_ph):
        if target_ph is None or paper_ph is None:
            return 0.5
        if target_ph == paper_ph:
            return 1.0
        
        diff = abs(target_ph - paper_ph)
        max_diff = 14.0
        return max(0, 1 - (diff / max_diff))

    @staticmethod
    def recommend_papers(all_papers, target_fiber_compositions, target_thickness, 
                         target_ph=None, top_n=10):
        if not all_papers:
            return []
        
        scored_papers = []
        
        for paper in all_papers:
            fiber_sim = PaperRecommender.calculate_fiber_similarity(
                target_fiber_compositions,
                paper.get('fiber_compositions', [])
            )
            
            thickness_sim = PaperRecommender.calculate_thickness_similarity(
                target_thickness,
                paper['thickness']
            )
            
            ph_sim = PaperRecommender.calculate_ph_similarity(target_ph, paper.get('ph_value'))
            
            overall_score = fiber_sim * 0.5 + thickness_sim * 0.4 + ph_sim * 0.1
            
            thickness_diff = abs(target_thickness - paper['thickness'])
            
            scored_papers.append({
                'paper': paper,
                'fiber_similarity': fiber_sim,
                'thickness_similarity': thickness_sim,
                'ph_similarity': ph_sim,
                'overall_score': overall_score,
                'thickness_diff': thickness_diff,
                'match_type': 'fiber' if fiber_sim > 0.5 else 'thickness'
            })
        
        fiber_matches = [p for p in scored_papers if p['fiber_similarity'] >= 0.5]
        thickness_matches = [p for p in scored_papers if p['fiber_similarity'] < 0.5]
        
        fiber_matches.sort(key=lambda x: (x['overall_score'], x['thickness_diff']), reverse=True)
        thickness_matches.sort(key=lambda x: (x['thickness_similarity'], x['overall_score']), reverse=True)
        
        final_recommendations = []
        seen_ids = set()
        
        for rec in fiber_matches:
            paper_id = rec['paper']['id']
            if paper_id not in seen_ids and len(final_recommendations) < top_n:
                final_recommendations.append(rec)
                seen_ids.add(paper_id)
        
        for rec in thickness_matches:
            paper_id = rec['paper']['id']
            if paper_id not in seen_ids and len(final_recommendations) < top_n:
                rec['match_type'] = 'thickness_only'
                final_recommendations.append(rec)
                seen_ids.add(paper_id)
        
        return final_recommendations
