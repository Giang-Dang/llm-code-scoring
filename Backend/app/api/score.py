from fastapi import APIRouter, HTTPException
import logging

from app.models.scoring.requests import ScoringRequest
from app.models.scoring.responses import ScoringResponse
from app.services.llm_services.llm_common_service import LLMCommonService


logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/score", response_model=ScoringResponse)
async def score(request: ScoringRequest) -> ScoringResponse:
    llm_service = LLMCommonService.get_llm_service(request.llm_provider)
    try:
        return await llm_service.generate_response(request)
    except HTTPException:
        raise
    except ValueError as err:
        logger.exception("Validation or parsing error while scoring")
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        logger.exception("Unexpected error while scoring")
        raise HTTPException(status_code=502, detail=f"Scoring failed: {err}")
