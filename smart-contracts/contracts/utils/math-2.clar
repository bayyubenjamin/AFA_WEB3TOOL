;; Math util updated 2026-05-30T08:23:58Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u14)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
