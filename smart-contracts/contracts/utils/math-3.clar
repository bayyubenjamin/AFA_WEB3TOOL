;; Math util updated 2026-05-30T16:36:01Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u47)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
