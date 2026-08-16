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

They were. Put both options in the same units, and when card rewards match on both sides,
everything cancels except the interest you give up by paying early. Over the months to the
trip, that came to 2.5%. Exactly the number they'd reasoned to in their head.

Then it built the calculator: enter the trip, get the answer, plus the exact rate move
that would flip it.

## Then I pasted the second text

My friend looked at version one and sent this back:

> "I think people would find this useful because they're not knowledgeable enough to know
> what variables to think about... If the app could do all countries and look up the
> exchange rates itself it would make it easier. Very cool analysis. A little complicated
> for most people. But I think a lot of people don't even think about these types of
> things."

I pasted that in too.

That message — a compliment with a complaint inside it — is what collapsed a ten-field
form into four questions, put a plain-language explanation of the trade-off above them,
and turned one hardcoded currency into 245 destinations pulling live rates.

I never translated either message into requirements. Both times the raw text was the
input.

## The one thing it argued with

My friend asked it to look up interest rates automatically too. It declined, and it was
right. There's no free feed for savings rates — only for central bank policy rates, and a
policy rate isn't what your account pays. Yours might pay 4%, or 0.01%. Automating that
would have produced a number that looked authoritative and was quietly wrong for most
people. It shipped an editable field with a nudge instead.

## The part worth noticing

The input was a conversation, not a specification. Nobody sat down to describe software.
A friend explained a problem clearly, then said honestly that the first attempt was too
complicated — and that was enough.

The scarce thing here was never the prompting. It was noticing that a decision most people
make badly could be made well, and then saying the most useful sentence in the whole
exchange: *a little complicated for most people.*

Try it: **jimzucker.github.io/exchange-rates**

Source: **github.com/jimzucker/exchange-rates**

It's a calculator, not financial advice — and it's honest about what it can't price. A
hotel shaving 10% off for prepaying swamps a 2% interest cushion entirely.
