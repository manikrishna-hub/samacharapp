def smart_reply_engine(message):
    msg = message.lower()

    # MOST IMPORTANT RULES FIRST
    if "how are you" in msg:
        return ["I'm good 😊", "Doing well!", "All good here ❤️"]
    
    if "where are you" in msg:
        return ["I'm on the way 🚗", "At home 🏠", "Coming soon 🙂"]

    if msg.startswith(("hi", "hello", "hey", "good morning", "good evening")):
        return ["Hello 😊", "Hi there!", "How can I help?"]

    if "thank" in msg:
        return ["You're welcome 😊", "Anytime!", "No problem!"]

    if "sorry" in msg:
        return ["It's okay ❤️", "No worries!", "All good!"]

    if msg in ["ok", "okay", "done"]:
        return ["Got it 👍", "Thanks!", "Perfect!"]

    if any(word in msg for word in ["meeting", "call", "join"]):
        return ["Yes, I will join 👍", "Give me 2 minutes", "Can't join now"]

    # Generic question reply
    if msg.endswith("?"):
        return ["Yes 👍", "No ❌", "Let me check…"]

    if any(word in msg for word in ["stress", "tired", "sad"]):
        return ["Take care ❤️", "Please rest", "I'm here for you"]

    if any(word in msg for word in ["send", "update", "check", "create", "fix"]):
        return ["Sure 👍", "Working on it…", "I'll update soon"]

    # DEFAULT
    return ["Okay 👍", "Got it!", "Sounds good 😊"]
