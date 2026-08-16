# A friend asked me a question about yen. Two messages later, it was a live app.

A friend messaged me last week with a travel problem. They're going to Japan in March,
the yen is unusually cheap right now, and the hotel is offering a choice: prepay on the
credit card today, or pay on arrival.

Prepaying earns card points now and locks in today's rate. Waiting keeps the money
earning interest for seven more months. In between sits the thing neither option
controls — the yen could move either way.

They'd already worked out the crux: the rate would have to move more than about 2.5%
before prepaying became the wrong call.

Then came the line that turned a chat message into a product:

> "It would be better if I could just go on an app, put in a couple things, and it would
> determine everything for me."

So I handed the message to Claude Code and watched.

## The question was already the hard part

The first thing it did was not write code. It derived the formula behind that 2.5% and
checked whether the number held.

It did. Put both options in the same units — dollars as of the day you'd otherwise pay —
and when card rewards match on both sides, everything cancels except the interest you
forgo. Over 212 days that came to 2.5%. Exactly what they'd reasoned to without writing
anything down.

I wasn't asking a machine to solve a problem nobody understood. I was asking it to
formalize one a smart non-expert had already half solved. Those are very different
tasks, and the second one goes fast.

## The second message was a product spec in disguise

The follow-up read like a compliment:

> "I think people would find this useful because they're not knowledgeable enough to know
> what variables to think about... A little complicated for most people. But I think a lot
> of people don't even think about these types of things."

Read it again. That is a product brief.

"A little complicated" killed the ten-field form. What's left on the surface is four
questions: where, how much, when, and what your cash earns.

"They don't know what variables to think about" put three cards above the questions,
naming the trade-off before asking anything. Prepaying gives you points today. Prepaying
costs you interest. Either way, the rate moves.

"Do all countries" turned one hardcoded currency into 245 destinations with live rates.

That wasn't a feature request. It was a description of who the user is and what they
don't know.

## The most useful thing it did was refuse

I also asked it to look up interest rates automatically. It declined, and it was right.

There's no free feed for savings rates. There *is* one for central bank policy rates —
but a policy rate isn't what your account pays. Yours might pay 4%, or 0.01%. Automating
that would have produced a number that looked authoritative and was quietly wrong for
most people.

What shipped instead is an editable field with a nudge: if your cash is in checking
earning nothing, enter zero.

An assistant that had just done what it was told would have built the worse thing.

The unglamorous half was verification. Rendering the page in a headless browser across
screen widths and both color themes caught six bugs before anyone saw it — including one
that only appears if your home currency is the yen. Nobody would have filed that. They'd
have quietly stopped trusting the tool.

## The part I keep thinking about

There were more than two messages. But everything after the first two was me typing "go"
and "commit it." Every decision that shaped what this *is* came from two messages written
by someone who wasn't trying to specify software.

The scarce skill was never prompting. It was that a friend noticed a decision most people
make badly, thought about it carefully enough to land within a rounding error of the right
answer, and then said the most useful sentence in the exchange: *a little complicated for
most people.*

Try it: **jimzucker.github.io/exchange-rates**

Source: **github.com/jimzucker/exchange-rates**

It's a calculator, not financial advice — and it's honest about what it can't price. A
hotel shaving 10% off for prepaying swamps a 2% interest cushion entirely. Which is the
other thing a good question does. It tells you where the math stops.
