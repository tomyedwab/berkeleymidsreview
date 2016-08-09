processed <- read.csv("~/source/berkeleymidsreview/export_data/processed.csv")

processed$MobileBin = processed$Mobile. == "True"
processed$ScrolledBin = processed$Scrolled. == "True"
processed$DismissedBin = processed$Dismissed. == "True"
processed$DisclosureBin = processed$Show.Disclosure == "True"
processed$DialogBin = processed$Show.Dialog == "True"

# Covariate checks!
mean(processed$DisclosureBin)
mean(processed$DialogBin)

browser.disc.m = chisq.test(table(processed$DisclosureBin, processed$Browser))
browser.disc.m$p.value
browser.dialog.m = chisq.test(table(processed$DialogBin, processed$Browser))
browser.dialog.m$p.value

os.disc.m = chisq.test(table(processed$DisclosureBin, processed$OS))
os.disc.m$p.value
os.dialog.m = chisq.test(table(processed$DialogBin, processed$OS))
os.dialog.m$p.value

mobile.disc.m = chisq.test(table(processed$DisclosureBin, processed$MobileBin))
mobile.disc.m$p.value
mobile.dialog.m = chisq.test(table(processed$DialogBin, processed$MobileBin))
mobile.dialog.m$p.value

source.disc.m = chisq.test(table(processed$DisclosureBin, processed$Source))
source.disc.m$p.value
source.dialog.m = chisq.test(table(processed$DialogBin, processed$Source))
source.dialog.m$p.value

# Estimate some effects
time.m = lm(Total.Page.Time ~ DisclosureBin + DialogBin + Source + MobileBin, data=processed)
pages.m = lm(Pages.Viewed ~ DisclosureBin + DialogBin + Source + MobileBin, data=processed)
scrolled.m = glm(ScrolledBin ~ DisclosureBin + DialogBin + Source + MobileBin, data=processed)
dismissed.m =  glm(DismissedBin ~ DisclosureBin + DialogBin + Source + MobileBin, data=processed)

summary(time.m)
summary(pages.m)
summary(scrolled.m)
summary(dismissed.m)