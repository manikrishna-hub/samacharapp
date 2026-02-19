
from django import template

register = template.Library()

@register.simple_tag
def unread_notifications(user):
    if not user.is_authenticated:
        return 0
    return 0  # safe default
