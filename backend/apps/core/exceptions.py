import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def clearspace_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None and isinstance(exc, DjangoValidationError):
        response = Response(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)
        response.status_code = status.HTTP_400_BAD_REQUEST

    if response is None:
        logger.exception("Unhandled API error", exc_info=exc)
        return Response(
            {
                "ok": False,
                "error": {
                    "message": "Something went wrong. Please try again.",
                    "code": "server_error",
                    "details": {},
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    details = response.data
    if isinstance(details, dict) and "detail" in details and len(details) == 1:
        message = str(details["detail"])
    elif response.status_code == status.HTTP_400_BAD_REQUEST:
        message = "Please check the details and try again."
    elif response.status_code == status.HTTP_401_UNAUTHORIZED:
        message = "Please sign in to continue."
    elif response.status_code == status.HTTP_403_FORBIDDEN:
        message = "You do not have permission to do that."
    elif response.status_code == status.HTTP_404_NOT_FOUND:
        message = "We couldn't find that item."
    else:
        message = "Something went wrong. Please try again."

    response.data = {
        "ok": False,
        "error": {
            "message": message,
            "code": getattr(exc, "default_code", "api_error"),
            "details": details,
        },
    }
    return response

