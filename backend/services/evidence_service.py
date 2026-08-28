from models.candidate import EvidenceItem
from typing import List, Optional, Dict

class EvidenceService:
    @staticmethod
    def get_evidence_by_id(evidence_list: List[EvidenceItem], evidence_id: str) -> Optional[EvidenceItem]:
        for item in evidence_list:
            if item.evidence_id.lower() == evidence_id.lower():
                return item
        return None

    @staticmethod
    def format_evidence_registry(evidence_list: List[EvidenceItem]) -> Dict[str, Dict]:
        registry = {}
        for item in evidence_list:
            registry[item.evidence_id] = {
                "source": item.source,
                "section": item.section,
                "quote": item.quote,
                "supports": item.supports,
                "candidate": item.candidate
            }
        return registry
