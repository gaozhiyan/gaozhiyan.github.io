---
output:
  html_document:
    css: style2.css
---

```{r setup, include=FALSE}
knitr::opts_chunk$set(echo = TRUE)
library(knitr)
```

## Project Model
#### Zhiyan Gao
#### June 10, 2019

The current project considers three member sequences of a word as cues and the word as the outcome. For example. Someone pronounced the word "ask" as [æsk], then the lexical outcome is "ask", while its cues are #æs, æsk, sk#, where the "#" represent word boundaries. Another person might pronounces the word "ask" as [æks], then the lexical outcome is still "ask", but the cues are #æk, æks, ks#. We have speech data from 100 native English speakers. Although most pronounced "ask" as [æsk], some people have pronunced it as [æks], In other words, the association strength from cues #sk to the outcome might be stronger than the association strength from #ks to the outcome. We used the `estimateWeight()` function in the `ndl` package to calculate the association strengths.The function was based on the Dank (2003)'s equilibrium equation. Table 1 shows the results for "ask" and "her"

```{r echo=FALSE}
data<-data.frame(
  Outcomes=c("ask","ask","ask","her","her","her"),
  Cues=c("#æk", "æks", "ks#","#ɚ#","#hɚ","hɚ#"),
  Association_Strength=c("0.166","0.167","0.667","1.000","0.500","0.500")
)
kable(data,caption = "Table 1: Association Strength")

```

Table 1 shows that “sk#” has a higher association strength than “#æs” or “æsk”. It is understandable given the fact the selected 100 native American English speakers did not always pronounce the “a” in “ask” as /æ/. They do, however, almost always pronounce the “sk” in “ask” as /sk/. In other words, the pronunciations of “a” is more variable than pronunciations of “sk”.  Given the calculated associated strengths, the association strength from [æsk.ɚ] to the outcome “ask her” is 1.000, which is calculated by summing up association strengths of all the tri-gram cues (i.e. #æs, æsk, sk#, #ɚ#) and then divide it by the number of words, which is two in this case. For L2 productions containing cues that are not observed in native speech data, the association strengths for the unobserved cues were defined as 0. For example, L2 production [ask.hɚ] contains cues #as, ask, sk#, #hɚ, hɚ#. Since “#as” and “ask” are not observed in native speech data, their association strengths are considered 0. The association strength from [ask.hɚ] to its outcome “ask her” is therefore $$(0+0+0.667+0.500+0.500)\div{2} = 0.834$$ The association strength for an L2 production could therefore be intuitively interpreted as how much the L2 production meets the native standard or how much the L2 production resembles its L1 target production.  For example, [ask.hɚ] resembles 83.4% of a typical L1 production for “ask her”. 

It is not desirable to include speech samples from all the 100 native speakers in modelling native speakers, because such treatment will increase the chance of overfitting. The current study opted to run the model estimation for 100 times, a practice advocated by Wieling (2013). Each time, a different set of 50 native American English speakers would be randomly chosen to build a slightly different native production model, which would generate a slightly different association strength for each tri-gram cue. Consequently, the phonological similarity between an L2 production to its L1 target was slightly different each time the model estimation was run. The averaged phonological similarity scores (NDL-scores henceforth) across 100 runs were recorded for further analysis as approximations for dsimilarity. 


