5 minute screen recording in google drive: 
https://drive.google.com/file/d/1p-Bny80Dwa86MSCsN-K725WR91VSZb8A/view?usp=share_link


For this code I added or built inside the following files:

/assignment/lib/getOrCreateSystemUser.ts
/assignment/lib/seedTradingOrders.ts
/assignment/app/transactions/page.tsx
/assignment/app/investing/secondary-trading/page.tsx
/assignment/app/investing/secondary-trading/[id]/page.tsx
/assignment/app/api/trading/assets/route.ts
/assignment/app/api/trading/orders/route.ts
/assignment/app/api/trading/orders/[id]/route.ts
/assignment/app/api/trading/my-orders/route.ts
/assignment/app/api/trading/user/route.ts
/assignment/components/portfolio/InvestmentsSection.tsx

The first main component that I completed was /investing/secondary-trading, adding a search bar and category filters.  While there is text in the search bar, I highlighted the outline in green to show that it is active as opposed to its neutral gray. In a similar vein if there is one or more categories selected in the search bar the button fills itself as green and the number of selected search categories pops up in the parenthesizes.

Next I moved on to ( /investing/secondary-trading/[id] ), in this section I added several additional UX features including a zoomable and scrollable chart for better interaction with longer datasets such as real world stocks. (similar to tradingView if you are familiar) Furthermore, I added the functionality to the buy and sell buttons to place orders. The necessary features such as displaying the users order book and orders section were also completed as specified. If I had more time I would have added a better confirmation window/pop-up when pressing the buy/sell button.

For the portfolio section:
I wrote in assignment/components/portfolio/InvestmentsSection.tsx 

-For UX I decided that when the tab opens the most important thing was “My Positions” so I made that also un-collapsed at the start with the user able to collapse it later

-I divided the section into two parts showing owned positions and pending orders. 
  -pending orders displayed essential info, that being the ticker, action, quantity and price
  -On the right hand side I placed a promienent cancel button as this is one of the most   important elements with   order ID being in small text for support 

I added code inside /assignment/components/portfolio/PortfolioSummaryCard.tsx to let the cards at the top reflect accurate money invested in shares. 



Backend logic: 
the majority of the backend logic was handled inside the assignment/app/api/trading folder. 
Inside were five subfolders of assets, my-orders, user, and orders (and orders/[id]) each with their own route.ts

-orders handles order creation and matching via a matching engine.
  -Buy orders reserve the full price upfront and refund any unused portion after execution.
  -Sell orders follow similar logic, ensuring proper balance updates and validation.
  -This would throw an error to console if the user did not have enough shares or money.

- orders/[id] this function was used to delete orders the user no longer wanted to be fulfilled. When done the block of money allocated to buy order would be returned to the user.

-assets mainly contained a get function to return the five asset and corresponding data. This was used in the other functions and investing/secondary-trading files

-my-orders open orders for a specific stock symbol and their current portfolio positions. It returns only active orders (not completed ones) along with the user’s holdings for use in a trading UI.

-user retrieves all trading data for the authenticated user, including their balance, holdings, orders, and trades. It returns that data as a single JSON response for use in a dashboard or UI.

Finally, I created a dedicated transactions page (/app/transactions) to display all completed trades, with its data served via a dedicated API route. This was designed to handle long-term account activity.

The logic to get the data is contained within assignment/app/api/transactions/route.ts.

Last are some utilities that I added:
assignment/lib/getOrCreateSystemUser.ts: in order to initialize the database with the fake order list a false user is created using this function.

assignment/lib/seedTradingOrders.ts: this is the function that puts the secondaryTradingAssets.json fake data into the database for this simulation. 



Decisions and tradeoffs:
Through all the backend I ensured that no data left the database containing user_id’s (other than those supplied in) or other order_id for which could not be authenticated with the correct user_id. This was done to emulate proper data safety. I remained unsure as to what the all documents button in portfolio was intended for, no instructions were given and I could not think of something that would relate, hence I intentionally left it in a non-functioning state. Given more guidance it could be completed easily.

As stated earlier I would have added a better confirm trade pop-up when clicking the buy/sell buttons. Other than this for the time I think I completed all the main objectives as well as any utility enhancements that I wanted. 

I was happy with the design choices mainly the zoomable charts that were generated. Also, all buttons in the website have a passive/hover/active color scheme (such as in /investing/secondary-trading tab) which I think is very nice and polished for the user. Error states are done properly, each error is handled so that nothing crashed the site and each has an individual error code.

