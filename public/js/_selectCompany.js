document.addEventListener("DOMContentLoaded", function () {
  const companyCards = document.querySelectorAll(".company-card");
  companyCards.forEach(card => {
    card.addEventListener("click", () => {
      const companyId = card.dataset.companyId;
      window.location.href = `/admin/my-company/${companyId}`;
    });
  });

  const newCompanyCard = document.querySelector(".new-company-card");
  if (newCompanyCard) {
    newCompanyCard.addEventListener("click", () => {
      window.location.href = "/admin/company/new-company";
    });
  }
});
