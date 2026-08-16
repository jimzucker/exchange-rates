# I pasted a friend's text message into Claude Code. It came back a working app.

A friend texted me a question last week. I didn't write a spec. I didn't turn it into
requirements or a ticket. I pasted their message in as it arrived and hit enter.

What came back is a live web app that now covers 245 countries.

Here is the entire input:

> "Since you're Mr. App Development, I have a good one for you to consider. We're going to
> Japan in March and currently the exchange rates are very favorable to the yen. So I have
> an option of prepaying now on my credit card which will give me credit card points but I
> will lose the interest that I would get on my money until March... I determined that the
> exchange rate would have to move more than 2 and 1/2% for me to be damaged by it as
> opposed to prepay. It would be better if I could just go on an app, put in a couple
> things and it would determine everything for me."

That's it. A chat message about a hotel booking, reasoning half-finished, the actual ask
buried in the last sentence.

## What it did with that

The first thing it did was not write code. It went after the 2.5% — derived the formula
behind the claim and checked whether my friend was right.

They were. Put both options in the same units and, when card rewards match, everything
cancels except the interest you give up by paying early. Over the months to the trip, that
came to 2.5%. Exactly the number they'd reasoned to in their head. Then it built the
calculator around it.

## Then I pasted the second text

My friend looked at version one and sent this back:

> "I think people would find this useful because they're not knowledgeable enough to know
> what variables to think about... If the app could do all countries and look up the
> exchange rates itself it would make it easier. Very cool analysis. A little complicated
> for most people. But I think a lot of people don't even think about these types of
> things."

I pasted that in too.

That message — a compliment with a complaint inside it — is what collapsed a ten-field
form into a handful of questions, put a plain-language explanation of the trade-off above
them, and turned one hardcoded currency into 245 destinations pulling live rates.

I never translated either message into requirements. Both times the raw text was the input.

## The one thing it argued with

My friend asked it to look up interest rates automatically too. It declined, and it was
right. There's no free feed for savings rates — only for central bank policy rates, which
aren't what your account pays. Yours might pay 4%, or 0.01%. Automating that would have
produced a number that looked authoritative and was quietly wrong for most people.

## Then I had a different AI review it

I pasted the app into ChatGPT and asked what was wrong with it. It found something real.

The app compared two identical prices, so the only things that could separate them were
interest and card points — making it, in its words, "an interest calculator with
exchange-rate sensitivity attached." The factors that usually decide this in real life
weren't in the maths at all: prepaid bookings are typically *discounted*, and usually
non-refundable.

It was right. The app now takes both prices separately and asks how likely your plans are
to change, pricing a cancellation as an expected loss. A 10% prepaid discount — routine at
hotels — moves the answer further than every interest calculation in it combined.

Two models, disagreeing usefully. One built it; the other refused to be impressed by it.

## Then I actually used it

Which found two more things, both invisible from the code.

The answer sits below the questions, so every edit scrolled the result out of view. Now a
compact bar pins it to the bottom of the screen while you type.

The second was worse, and the *previous fix* had caused it. Told that it sounded
overconfident, the app had become so cautious that changing your savings rate from 0% to
5% left the headline reading "financially near break-even" the whole way. The numbers
underneath were all moving. The one line anybody reads wasn't.

So the headline now always names whoever's ahead, and what varies is how sure it sounds:
*slightly ahead* for a lean, *the better bet* once the gap outgrows what the currency
normally does. Honesty was never the problem. Refusing to answer was.

## The part worth noticing

The input was a conversation, not a specification. Nobody sat down to describe software. A
friend explained a problem clearly, said honestly that the first attempt was too
complicated, a rival model called the framing simplistic, and using it myself turned up
what neither had seen.

None of that was prompting. Every improvement came from someone saying plainly what was
wrong with what they were looking at — and the most useful sentence in the whole exchange
was still the first one: *a little complicated for most people.*

Try it: **jimzucker.github.io/exchange-rates**

Source: **github.com/jimzucker/exchange-rates**

It's a calculator, not financial advice — and it's honest about what it still can't price:
how much you value simply being able to change your mind.
