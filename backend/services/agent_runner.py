import asyncio
from typing import List, Dict
from models.candidate import CandidateProfile
from models.evaluation import AgentEvaluationSchema, AgentEvaluationRecord
from agents.technical import TechnicalAgent
from agents.hr_culture import HRCultureAgent
from agents.hiring_manager import HiringManagerAgent
from agents.skeptic import SkepticAgent
import uuid
from datetime import datetime

class AgentRunner:
    def __init__(self):
        self.technical_agent = TechnicalAgent()
        self.hr_culture_agent = HRCultureAgent()
        self.hiring_manager_agent = HiringManagerAgent()
        self.skeptic_agent = SkepticAgent()

    async def run_all_independent_agents(
        self, candidate_name: str, profile: CandidateProfile, job_requirements: dict
    ) -> List[AgentEvaluationSchema]:
        """
        Executes all four agents independently in isolated calls.
        No agent receives another agent's conclusions.
        """
        loop = asyncio.get_event_loop()
        
        tech_task = loop.run_in_executor(None, self.technical_agent.evaluate, candidate_name, profile, job_requirements)
        hr_task = loop.run_in_executor(None, self.hr_culture_agent.evaluate, candidate_name, profile, job_requirements)
        hm_task = loop.run_in_executor(None, self.hiring_manager_agent.evaluate, candidate_name, profile, job_requirements)
        skeptic_task = loop.run_in_executor(None, self.skeptic_agent.evaluate, candidate_name, profile, job_requirements)

        results = await asyncio.gather(tech_task, hr_task, hm_task, skeptic_task)
        return list(results)
