class Solution:
    def topKFrequent(self, nums, k):
        def most_freq(nums):
            max_occur = 0
            max_n = nums[0]
            for i in range(len(nums)):
                curr_occur = 1
                for j in range(len(nums)):
                    if i == j:
                        continue
                    if nums[i] == nums[j]:
                        curr_occur += 1
                if curr_occur > max_occur:
                    max_occur = curr_occur
                    max_n = nums[i]
            return max_n
        return most_freq([1])

a = Solution()
print(a.topKFrequent([11], 2))
