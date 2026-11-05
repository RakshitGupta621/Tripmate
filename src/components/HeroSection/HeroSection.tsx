import { Sparkles } from 'lucide-react'
import appContent from '../../appContent.json'

export default function HeroSection() {
  const content = appContent.hero
  return (
    <section className="hero" id="home">
      <div className="hero-copy">
        <span className="eyebrow">
          <span className="eyebrow-star">✳</span> {content.eyebrow}
        </span>
        <h1>
          {content.title}
          <br />
          <em>{content.titleAccent}</em>
        </h1>
        <p className="hero-intro">{content.description}</p>
        <div className="hero-note">
          <span className="note-icon">
            <Sparkles size={16} />
          </span>
          <span>
            <b>{content.noteTitle}</b>
            <br />
            {content.noteDescription}
          </span>
        </div>
        <div className="hero-stats">
          <span>
            <b>✦</b> {content.statOne}
          </span>
          <span>
            <b>↗</b> {content.statTwo}
          </span>
        </div>
      </div>
      <div className="hero-art" role="img" aria-label={content.illustrationLabel}>
        <div className="art-sun" />
        <div className="art-cloud cloud-one" />
        <div className="art-cloud cloud-two" />
        <div className="art-hill hill-back" />
        <div className="art-hill hill-front" />
        <div className="art-water" />
        <div className="art-road" />
        <div className="art-house">
          <div className="house-roof" />
          <div className="house-body">
            <span className="window" />
            <span className="door" />
          </div>
        </div>
        <div className="art-tree tree-one">
          <i />
          <i />
          <i />
          <b />
        </div>
        <div className="art-tree tree-two">
          <i />
          <i />
          <i />
          <b />
        </div>
        <div className="art-label">
          <span>✳</span>
          <div>
            {content.artLabel}
            <small>{content.artSubLabel}</small>
          </div>
        </div>
        <div className="art-postcard">
          {content.postcard}
          <br />
          {content.postcardSecondLine} <span>↗</span>
        </div>
        <div className="art-coordinates">{content.coordinates}</div>
      </div>
    </section>
  )
}
