def avatar_display_url(profile, request=None):
    """URL efetiva do avatar: upload local tem prioridade sobre avatar_url externa."""
    if profile is None:
        return None
    if profile.avatar:
        url = profile.avatar.url
        return request.build_absolute_uri(url) if request else url
    return profile.avatar_url or None
