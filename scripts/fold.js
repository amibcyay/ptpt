/* Accent-insensitive Portuguese matching: café ↔ cafe, não ↔ nao. */
(function (w) {
  w.foldPt = function foldPt(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };
})(window);
