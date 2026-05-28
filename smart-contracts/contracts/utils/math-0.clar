;; Math util updated 2026-05-28T03:20:37Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u67)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
