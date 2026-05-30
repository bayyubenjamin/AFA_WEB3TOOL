;; Math util updated 2026-05-30T12:52:34Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u33)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
