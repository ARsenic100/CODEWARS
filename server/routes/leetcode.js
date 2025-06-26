const express = require('express');
const fetch = require('node-fetch'); // If Node 18+, you can use the built-in fetch
const router = express.Router();

router.get('/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
              profile {
                userAvatar
                countryName
                ranking
                realName
              }
            }
          }
        `,
        variables: { username }
      })
    });
    const data = await response.json();
    res.json(data.data.matchedUser);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch LeetCode profile' });
  }
});

module.exports = router;