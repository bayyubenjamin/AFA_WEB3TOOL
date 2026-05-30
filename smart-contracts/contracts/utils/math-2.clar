;; Math util updated 2026-05-30T17:04:00Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u49)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
