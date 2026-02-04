// Static comparison data for each denomination
// Used by the denomination comparison tool at /churches/denominations/compare

export interface DenominationProfile {
  name: string;
  slug: string;
  overview: string;
  founded: string;
  governance: string;
  governanceDescription: string;
  beliefs: string[];
  worshipDescription: string;
  typicalWorshipStyles: string[];
  sacraments: string;
  baptism: string;
  communion: string;
  distinctives: string[];
  relatedDenominations: string[];
}

export const DENOMINATION_PROFILES: Record<string, DenominationProfile> = {
  'non-denominational': {
    name: 'Non-denominational',
    slug: 'non-denominational',
    overview:
      'Non-denominational churches operate independently without affiliation to a larger denominational body. They typically emphasize Bible-based teaching, contemporary worship, and practical application of faith to everyday life.',
    founded: 'Modern movement growing since the 1960s-70s, though independent churches have existed throughout Christian history',
    governance: 'Congregational',
    governanceDescription:
      'Each church is self-governing with its own leadership structure, often led by a senior pastor and elder board.',
    beliefs: [
      'Authority of the Bible as the primary guide for faith and practice',
      'Salvation through faith in Jesus Christ',
      'Emphasis on personal relationship with God',
      'Generally evangelical in theology',
      'Varies widely by congregation on secondary doctrines',
    ],
    worshipDescription:
      'Typically features contemporary music with a worship band, projected lyrics, and casual atmosphere. Services often include a sermon focused on practical life application.',
    typicalWorshipStyles: ['Contemporary', 'Blended'],
    sacraments: 'Generally observes baptism and communion as ordinances rather than sacraments',
    baptism: 'Believer\'s baptism by immersion, typically for those who have made a personal decision of faith',
    communion: 'Symbolic remembrance, usually observed monthly or quarterly with individual cups and bread',
    distinctives: [
      'No formal denominational hierarchy or creed beyond the Bible',
      'Flexible worship format that adapts to the local community',
      'Strong emphasis on relevance and accessibility for newcomers',
      'Often among the fastest-growing churches in America',
    ],
    relatedDenominations: ['Evangelical', 'Baptist', 'Charismatic'],
  },
  baptist: {
    name: 'Baptist',
    slug: 'baptist',
    overview:
      'Baptist churches emphasize believer\'s baptism by immersion, the authority of Scripture, and the autonomy of the local congregation. The Baptist tradition has a strong emphasis on personal faith, evangelism, and religious liberty.',
    founded: 'Early 1600s in England and the Netherlands, with roots in the broader Protestant Reformation',
    governance: 'Congregational',
    governanceDescription:
      'Each local church is autonomous and self-governing. Members vote on major decisions. Churches may voluntarily associate with conventions or associations.',
    beliefs: [
      'Authority and sufficiency of Scripture (sola scriptura)',
      'Believer\'s baptism by immersion only',
      'Priesthood of all believers',
      'Autonomy of the local church',
      'Salvation by grace through faith alone',
      'Religious liberty and separation of church and state',
    ],
    worshipDescription:
      'Worship varies from traditional hymns with choir to contemporary praise bands. Preaching is central, often expository or topical, with an invitation or altar call.',
    typicalWorshipStyles: ['Blended', 'Traditional', 'Contemporary'],
    sacraments: 'Two ordinances: baptism and the Lord\'s Supper (viewed as symbolic, not sacramental)',
    baptism: 'Believer\'s baptism by full immersion only; infant baptism is not practiced',
    communion: 'Symbolic memorial of Christ\'s sacrifice, typically observed monthly; most practice open communion',
    distinctives: [
      'Strong emphasis on evangelism and missions',
      'Historically champions of religious freedom',
      'No creed but the Bible as the sole rule of faith',
      'Diverse movement spanning conservative to moderate theology',
    ],
    relatedDenominations: ['Southern Baptist', 'Evangelical', 'Non-denominational'],
  },
  'southern-baptist': {
    name: 'Southern Baptist',
    slug: 'southern-baptist',
    overview:
      'The Southern Baptist Convention (SBC) is the largest Protestant denomination in the United States. Southern Baptist churches share Baptist distinctives while cooperating through a convention structure for missions, education, and ministry.',
    founded: '1845 in Augusta, Georgia, separating from northern Baptists; now a nationwide denomination',
    governance: 'Congregational with cooperative convention',
    governanceDescription:
      'Each church is fully autonomous. Churches voluntarily cooperate through the Southern Baptist Convention, contributing to missions through the Cooperative Program.',
    beliefs: [
      'Inerrancy of Scripture as stated in the Baptist Faith & Message',
      'Believer\'s baptism by immersion',
      'Eternal security of the believer (once saved, always saved)',
      'Complementarian view of gender roles in church leadership',
      'Strong emphasis on the Great Commission',
    ],
    worshipDescription:
      'Ranges from traditional with hymns and choir to fully contemporary with worship bands. Preaching is central, typically running 30-45 minutes with strong biblical exposition.',
    typicalWorshipStyles: ['Blended', 'Traditional', 'Contemporary'],
    sacraments: 'Two ordinances: believer\'s baptism and the Lord\'s Supper',
    baptism: 'Believer\'s baptism by immersion; many churches require baptism for membership',
    communion: 'Symbolic memorial, usually monthly; typically closed to baptized believers',
    distinctives: [
      'Largest Protestant denomination in the US with ~47,000 churches',
      'Cooperative Program funds one of the world\'s largest mission networks',
      'Strong emphasis on church planting and evangelism',
      'Operates six theological seminaries',
    ],
    relatedDenominations: ['Baptist', 'Evangelical', 'Reformed'],
  },
  catholic: {
    name: 'Catholic',
    slug: 'catholic',
    overview:
      'The Catholic Church is the largest Christian church worldwide, with a continuous tradition tracing back to the apostles. Catholic faith centers on the sacraments, sacred tradition alongside Scripture, and the teaching authority of the Pope and bishops.',
    founded: 'Traces its origins to Jesus Christ and the apostles in the 1st century; organized papacy from early centuries',
    governance: 'Episcopal (hierarchical)',
    governanceDescription:
      'Hierarchical structure led by the Pope in Rome, with cardinals, archbishops, bishops, and priests. Each diocese is led by a bishop, each parish by a priest.',
    beliefs: [
      'Scripture and Sacred Tradition as equal sources of authority',
      'Seven sacraments as means of grace',
      'Real Presence of Christ in the Eucharist (transubstantiation)',
      'Authority of the Pope and Magisterium (teaching office)',
      'Veneration of Mary and the saints',
      'Salvation through faith and works cooperating with grace',
    ],
    worshipDescription:
      'Liturgical worship centered on the Mass, following a set order of readings, prayers, and the Eucharist. Services follow the liturgical calendar with seasonal vestments and rituals.',
    typicalWorshipStyles: ['Liturgical', 'Traditional'],
    sacraments: 'Seven sacraments: Baptism, Confirmation, Eucharist, Reconciliation, Anointing of the Sick, Holy Orders, Matrimony',
    baptism: 'Infant baptism by pouring or sprinkling; viewed as removing original sin and initiating into the church',
    communion: 'The Eucharist (Mass) is central; believed to be the actual body and blood of Christ. Received weekly or more.',
    distinctives: [
      'Largest Christian body worldwide with over 1 billion members',
      'Rich tradition of art, architecture, music, and scholarship',
      'Extensive global charitable and educational network',
      'Liturgical worship with deep historical roots',
    ],
    relatedDenominations: ['Episcopal', 'Orthodox', 'Lutheran'],
  },
  methodist: {
    name: 'Methodist',
    slug: 'methodist',
    overview:
      'Methodist churches trace their origins to John Wesley\'s 18th-century revival movement within the Church of England. Methodism emphasizes personal holiness, social justice, grace available to all, and structured spiritual growth.',
    founded: '1730s in England through John and Charles Wesley\'s ministry; organized in America in 1784',
    governance: 'Connectional (modified episcopal)',
    governanceDescription:
      'Churches are connected through annual conferences and a general conference. Bishops oversee regions, and pastors are appointed (not called) to churches by the bishop.',
    beliefs: [
      'Prevenient, justifying, and sanctifying grace available to all',
      'Wesleyan quadrilateral: Scripture, tradition, reason, and experience',
      'Personal and social holiness',
      'Free will and the possibility of falling from grace',
      'The pursuit of Christian perfection (entire sanctification)',
    ],
    worshipDescription:
      'Blends traditional hymns (many by Charles Wesley) with contemporary elements. Services follow a structured liturgy but with flexibility. Preaching emphasizes practical faith and social responsibility.',
    typicalWorshipStyles: ['Traditional', 'Blended'],
    sacraments: 'Two sacraments: Baptism and Holy Communion, seen as means of grace',
    baptism: 'Infant and adult baptism accepted; sprinkling, pouring, or immersion; viewed as a covenant with God',
    communion: 'Open table—all are welcome. Christ is spiritually present. Usually observed monthly.',
    distinctives: [
      'Strong tradition of social justice advocacy and community service',
      'Methodical approach to spiritual growth (hence the name "Methodist")',
      'Rich hymn tradition from Charles Wesley',
      'Emphasis on grace as accessible to every person',
    ],
    relatedDenominations: ['United Methodist', 'Nazarene', 'Episcopal'],
  },
  'united-methodist': {
    name: 'United Methodist',
    slug: 'united-methodist',
    overview:
      'The United Methodist Church (UMC) is one of the largest mainline Protestant denominations in America, formed from the merger of the Methodist Church and the Evangelical United Brethren in 1968. It carries forward the Wesleyan tradition of combining personal piety with social action.',
    founded: '1968 through denominational merger; roots in Wesley\'s 18th-century movement',
    governance: 'Connectional (episcopal)',
    governanceDescription:
      'Governed by the General Conference (legislative body), with bishops overseeing annual conferences. Pastors are appointed to churches by the bishop and cabinet.',
    beliefs: [
      'Wesleyan theology emphasizing grace, faith, and holiness',
      'Open to theological diversity within boundaries',
      'Social Principles addressing justice, peace, and human dignity',
      'Scripture as primary but interpreted through tradition, reason, and experience',
      'Inclusivity and welcome as core values',
    ],
    worshipDescription:
      'Varies widely from traditional liturgical worship with organ and choir to contemporary services with praise bands. The UMC Book of Worship provides structure while allowing local adaptation.',
    typicalWorshipStyles: ['Traditional', 'Blended'],
    sacraments: 'Two sacraments: Baptism and Holy Communion',
    baptism: 'Infant and adult baptism by any mode (sprinkling, pouring, immersion)',
    communion: 'Open communion—everyone is invited. Celebrated at least monthly in many churches.',
    distinctives: [
      'One of the largest mainline denominations with global reach',
      'Strong emphasis on both personal faith and social justice',
      'Connectional system means churches support each other financially',
      'Currently navigating significant restructuring and theological discussions',
    ],
    relatedDenominations: ['Methodist', 'Presbyterian', 'Episcopal'],
  },
  lutheran: {
    name: 'Lutheran',
    slug: 'lutheran',
    overview:
      'Lutheran churches follow the theology of Martin Luther, who sparked the Protestant Reformation in 1517. Lutheranism emphasizes salvation by grace through faith, the authority of Scripture, and the real presence of Christ in communion.',
    founded: '1517 German Reformation led by Martin Luther; established as a distinct tradition by the mid-1500s',
    governance: 'Varies by synod (episcopal or congregational elements)',
    governanceDescription:
      'Structure varies: the ELCA uses a bishop-led model, while the LCMS gives more authority to local congregations. Both have regional and national organizational bodies.',
    beliefs: [
      'Salvation by grace alone through faith alone (sola gratia, sola fide)',
      'Scripture alone as the authority for faith (sola scriptura)',
      'Law and Gospel distinction in preaching',
      'Real presence of Christ "in, with, and under" the bread and wine',
      'Two kingdoms doctrine (church and state have distinct roles)',
    ],
    worshipDescription:
      'Historically liturgical with hymns, responsive readings, and a structured order of service. Many Lutheran churches use a hymnal. Contemporary services are increasingly common, especially in the ELCA.',
    typicalWorshipStyles: ['Liturgical', 'Traditional', 'Blended'],
    sacraments: 'Two sacraments: Baptism and the Lord\'s Supper (Eucharist)',
    baptism: 'Infant baptism by pouring or sprinkling; seen as God\'s act of grace that creates faith',
    communion: 'Real presence—Christ is truly present in the bread and wine (sacramental union). Usually every Sunday.',
    distinctives: [
      'Born from the Protestant Reformation, emphasizing grace and Scripture',
      'Rich tradition of congregational hymn singing',
      'Strong parochial school system (especially LCMS)',
      'Theological spectrum from conservative (LCMS) to progressive (ELCA)',
    ],
    relatedDenominations: ['Episcopal', 'Catholic', 'Presbyterian'],
  },
  presbyterian: {
    name: 'Presbyterian',
    slug: 'presbyterian',
    overview:
      'Presbyterian churches follow the Reformed theological tradition of John Calvin and John Knox, emphasizing God\'s sovereignty, the authority of Scripture, and governance by elected elders (presbyters). They are known for intellectual rigor and orderly worship.',
    founded: '1560s in Scotland through John Knox; established in America in the 1700s',
    governance: 'Presbyterian (rule by elders)',
    governanceDescription:
      'Governed at multiple levels: the local session (elders), the regional presbytery, the synod, and the general assembly. Pastors and elders share authority equally.',
    beliefs: [
      'Sovereignty of God in all things',
      'Reformed theology (Calvinist tradition)',
      'Authority of Scripture guided by historic confessions (Westminster Standards)',
      'Election and predestination as expressions of God\'s grace',
      'Covenant theology connecting Old and New Testaments',
    ],
    worshipDescription:
      'Orderly, Word-centered worship with a strong emphasis on preaching and Scripture reading. Services may include traditional hymns, responsive readings, and formal prayers. Some congregations incorporate contemporary elements.',
    typicalWorshipStyles: ['Traditional', 'Blended'],
    sacraments: 'Two sacraments: Baptism and the Lord\'s Supper',
    baptism: 'Infant and adult baptism by sprinkling or pouring; sign of God\'s covenant promise',
    communion: 'Spiritual presence of Christ. Frequency varies; often monthly or quarterly. Generally open communion.',
    distinctives: [
      'Governance by elected elders balances authority across the church',
      'Strong intellectual and educational tradition',
      'Historic confessions and catechisms guide theology',
      'Spectrum from conservative (PCA) to progressive (PCUSA)',
    ],
    relatedDenominations: ['Reformed', 'Lutheran', 'Methodist'],
  },
  pentecostal: {
    name: 'Pentecostal',
    slug: 'pentecostal',
    overview:
      'Pentecostal churches emphasize the work of the Holy Spirit, including speaking in tongues, divine healing, and prophecy as active gifts for today. Worship is expressive and Spirit-led, with a strong emphasis on personal spiritual experience.',
    founded: 'Early 1900s, often traced to the 1906 Azusa Street Revival in Los Angeles',
    governance: 'Varies (congregational or episcopal depending on denomination)',
    governanceDescription:
      'Governance varies widely. Some Pentecostal churches are fully independent; others belong to denominations like the Assemblies of God or Church of God with varying levels of organizational structure.',
    beliefs: [
      'Baptism in the Holy Spirit as a distinct experience after salvation',
      'Speaking in tongues as evidence of Spirit baptism',
      'Continuation of all spiritual gifts (healing, prophecy, miracles)',
      'Authority of Scripture',
      'Holiness and separation from worldliness',
    ],
    worshipDescription:
      'Energetic, Spirit-led worship with extended singing, spontaneous prayer, and open expression. Services may include speaking in tongues, prophecy, and prayer for healing. Preaching is passionate and evangelistic.',
    typicalWorshipStyles: ['Charismatic', 'Contemporary'],
    sacraments: 'Typically two ordinances: water baptism and communion (viewed symbolically)',
    baptism: 'Believer\'s baptism by immersion; some practice baptism in Jesus\' name only',
    communion: 'Symbolic memorial, observed periodically; frequency varies by congregation',
    distinctives: [
      'Emphasis on direct, personal experience of the Holy Spirit',
      'One of the fastest-growing Christian movements worldwide',
      'Vibrant, emotionally expressive worship culture',
      'Strong emphasis on divine healing and miracles',
    ],
    relatedDenominations: ['Assemblies of God', 'Church of God', 'Charismatic'],
  },
  'assemblies-of-god': {
    name: 'Assemblies of God',
    slug: 'assemblies-of-god',
    overview:
      'The Assemblies of God (AG) is the world\'s largest Pentecostal denomination. It combines Pentecostal theology with organized denominational structure, emphasizing Spirit-empowered living, evangelism, and global missions.',
    founded: '1914 in Hot Springs, Arkansas, by a group of Pentecostal ministers seeking cooperative fellowship',
    governance: 'Presbyterian-congregational hybrid',
    governanceDescription:
      'Cooperative fellowship model: local churches are self-governing but affiliated through district and national councils. The General Council sets doctrine and coordinates missions.',
    beliefs: [
      'Four core doctrines: Salvation, Baptism in the Holy Spirit, Divine Healing, Second Coming of Christ',
      'Speaking in tongues as initial evidence of Spirit baptism',
      'Divine healing provided in the atonement',
      'Premillennial return of Christ',
      'Authority of Scripture as infallible and inspired',
    ],
    worshipDescription:
      'Contemporary, energetic worship with praise bands and extended musical worship. Services include prayer, preaching, and often altar calls. Many AG churches blend charismatic elements with polished production.',
    typicalWorshipStyles: ['Contemporary', 'Charismatic'],
    sacraments: 'Two ordinances: water baptism (by immersion) and the Lord\'s Supper',
    baptism: 'Believer\'s baptism by immersion in the name of the Father, Son, and Holy Spirit',
    communion: 'Symbolic memorial, open to all believers; observed regularly but frequency varies',
    distinctives: [
      'World\'s largest Pentecostal denomination with 69+ million adherents globally',
      'One of the largest missionary-sending organizations in the world',
      'Combines Spirit-filled worship with organizational structure',
      'Strong emphasis on youth and children\'s ministry',
    ],
    relatedDenominations: ['Pentecostal', 'Church of God', 'Charismatic'],
  },
  'church-of-christ': {
    name: 'Church of Christ',
    slug: 'church-of-christ',
    overview:
      'Churches of Christ seek to restore New Testament Christianity by following only what is explicitly taught in Scripture. They are known for a cappella worship, weekly communion, and a non-denominational identity rooted in the Restoration Movement.',
    founded: 'Early 1800s in America through the Stone-Campbell Restoration Movement',
    governance: 'Congregational with elder leadership',
    governanceDescription:
      'Each congregation is fully autonomous with no denominational headquarters. Local churches are led by a plurality of elders (also called shepherds) and served by deacons.',
    beliefs: [
      'Bible as the sole authority (no creeds or confessions)',
      'Baptism by immersion as essential for salvation',
      'Weekly observance of the Lord\'s Supper',
      'A cappella singing as the only authorized form of worship music',
      'Restoration of the New Testament church pattern',
    ],
    worshipDescription:
      'Distinctive a cappella congregational singing without musical instruments. Services are simple and Scripture-focused with prayers, communion, a sermon, and a collection. Worship follows what members see as the New Testament pattern.',
    typicalWorshipStyles: ['Traditional'],
    sacraments: 'Baptism and the Lord\'s Supper observed as commanded in the New Testament',
    baptism: 'Believer\'s baptism by immersion for the forgiveness of sins; considered essential for salvation',
    communion: 'Observed every Sunday as a central act of worship; unleavened bread and grape juice',
    distinctives: [
      'A cappella worship—no musical instruments used in services',
      'Weekly communion as a non-negotiable practice',
      'No formal denominational structure or creed',
      'Strong emphasis on biblical authority and New Testament patterns',
    ],
    relatedDenominations: ['Evangelical', 'Baptist', 'Nazarene'],
  },
  episcopal: {
    name: 'Episcopal',
    slug: 'episcopal',
    overview:
      'The Episcopal Church is the American branch of the worldwide Anglican Communion. It combines Catholic liturgical tradition with Protestant theology, governed by bishops while valuing congregational participation and theological breadth.',
    founded: 'Organized in America in 1789 after independence from England; roots in the Church of England (1534)',
    governance: 'Episcopal (bishop-led)',
    governanceDescription:
      'Led by bishops who oversee dioceses. The General Convention (clergy and laity together) sets policy. The Presiding Bishop leads nationally. Each parish has a rector and vestry.',
    beliefs: [
      'Scripture, tradition, and reason as sources of authority (three-legged stool)',
      'The historic creeds (Apostles\' and Nicene) as statements of faith',
      'Real presence of Christ in the Eucharist',
      'Apostolic succession through bishops',
      'Theological breadth embracing diverse perspectives',
    ],
    worshipDescription:
      'Liturgical worship following the Book of Common Prayer with set readings, prayers, and responses. The Eucharist is central. Services may range from traditional high church (incense, vestments) to informal contemporary settings.',
    typicalWorshipStyles: ['Liturgical', 'Traditional'],
    sacraments: 'Two great sacraments (Baptism and Eucharist) plus five sacramental rites',
    baptism: 'Infant and adult baptism; baptism is full initiation into the church for all ages',
    communion: 'Open table—all baptized Christians are welcome. Real spiritual presence of Christ. Usually weekly.',
    distinctives: [
      'Blends Catholic liturgical practice with Protestant theology',
      'Known for welcoming theological diversity',
      'Book of Common Prayer unites worship across congregations',
      'Strong tradition of social justice engagement',
    ],
    relatedDenominations: ['Catholic', 'Lutheran', 'Methodist'],
  },
  'church-of-god': {
    name: 'Church of God',
    slug: 'church-of-god',
    overview:
      'The Church of God (Cleveland, Tennessee) is a Pentecostal-Holiness denomination emphasizing Spirit baptism, sanctification, and holiness living. It combines Wesleyan-Holiness roots with Pentecostal spiritual experience.',
    founded: '1886 in Monroe County, Tennessee, as a holiness revival movement',
    governance: 'Episcopal (centralized denomination)',
    governanceDescription:
      'Organized structure with a General Assembly as the highest authority. International offices in Cleveland, Tennessee oversee state and regional bodies. Pastors are appointed by state overseers.',
    beliefs: [
      'Justification, sanctification, and baptism of the Holy Spirit as distinct experiences',
      'Speaking in tongues as evidence of Spirit baptism',
      'Divine healing through prayer',
      'Premillennial second coming of Christ',
      'Holiness in personal conduct and lifestyle',
    ],
    worshipDescription:
      'Expressive, Spirit-led worship with contemporary and gospel music. Services include extended praise and worship, prayer, preaching, and altar calls. Spontaneous expressions of worship are welcomed.',
    typicalWorshipStyles: ['Charismatic', 'Gospel', 'Contemporary'],
    sacraments: 'Three ordinances: water baptism, Lord\'s Supper, and foot washing',
    baptism: 'Believer\'s baptism by immersion',
    communion: 'Observed periodically as a memorial; often accompanied by foot washing',
    distinctives: [
      'Practices foot washing as an ordinance alongside communion',
      'Wesleyan-Holiness roots combined with Pentecostal experience',
      'Strong emphasis on personal holiness and sanctification',
      'Active in global missions and church planting',
    ],
    relatedDenominations: ['Pentecostal', 'Assemblies of God', 'Nazarene'],
  },
  nazarene: {
    name: 'Nazarene',
    slug: 'nazarene',
    overview:
      'The Church of the Nazarene is a Wesleyan-Holiness denomination that emphasizes entire sanctification—the belief that God can free believers from the power of sin in this life. It combines evangelical theology with a warm, community-oriented culture.',
    founded: '1908 through the merger of several holiness groups in Pilot Point, Texas',
    governance: 'Representative (connectional)',
    governanceDescription:
      'A representative form of governance with district superintendents, a Board of General Superintendents, and a General Assembly. Pastors are called by congregational vote and approved by the district.',
    beliefs: [
      'Entire sanctification as a second work of grace',
      'Wesleyan-Arminian theology (free will, resistible grace)',
      'Authority of Scripture for faith and practice',
      'The church as a community of holy living',
      'Mission to spread scriptural holiness across the land',
    ],
    worshipDescription:
      'Blended worship that ranges from traditional hymns to contemporary praise. Services are welcoming and focused on both worship and teaching. Many Nazarene churches have a warm, family-oriented atmosphere.',
    typicalWorshipStyles: ['Blended', 'Contemporary'],
    sacraments: 'Two sacraments: Baptism and the Lord\'s Supper',
    baptism: 'Infant and adult baptism by any mode; viewed as a sign of God\'s grace and the new covenant',
    communion: 'Open communion welcoming all believers. Observed regularly as a means of grace.',
    distinctives: [
      'Emphasis on heart holiness and the possibility of victorious Christian living',
      'Strong network of Nazarene universities and colleges worldwide',
      'Global denomination with a majority of members outside the US',
      'Compassionate ministry tradition through Nazarene Compassionate Ministries',
    ],
    relatedDenominations: ['Methodist', 'Church of God', 'Evangelical'],
  },
  'seventh-day-adventist': {
    name: 'Seventh-day Adventist',
    slug: 'seventh-day-adventist',
    overview:
      'Seventh-day Adventists observe Saturday (the seventh day) as the Sabbath, emphasize the imminent second coming of Christ, and promote holistic health. The denomination is known for its health institutions, educational system, and global humanitarian work.',
    founded: 'Formally organized in 1863 in Battle Creek, Michigan, with roots in the Millerite movement of the 1840s',
    governance: 'Representative (hierarchical)',
    governanceDescription:
      'Four levels of organization: local church, local conference, union conference, and the General Conference (world headquarters). Pastors are employed by the conference, not the local church.',
    beliefs: [
      'Saturday Sabbath observance as the biblical day of rest',
      'Imminent, literal, visible second coming of Christ',
      'Holistic health (body as temple of the Holy Spirit)',
      'State of the dead (soul sleep until resurrection)',
      'Investigative judgment beginning in 1844',
      'Prophetic ministry of Ellen G. White',
    ],
    worshipDescription:
      'Saturday morning worship services featuring hymns, Scripture reading, prayer, and a sermon. Services also include Sabbath School (Bible study classes). Worship style is generally reverent and traditional.',
    typicalWorshipStyles: ['Traditional', 'Blended'],
    sacraments: 'Three ordinances: baptism, communion, and foot washing',
    baptism: 'Believer\'s baptism by immersion after instruction and commitment',
    communion: 'Open communion observed quarterly, preceded by a foot-washing ceremony symbolizing humility and service',
    distinctives: [
      'Saturday worship (Sabbath-keeping) as a key identity marker',
      'World-renowned health emphasis and hospital system',
      'One of the largest Protestant educational systems globally',
      'ADRA (Adventist Development and Relief Agency) provides global humanitarian aid',
    ],
    relatedDenominations: ['Baptist', 'Church of Christ', 'Evangelical'],
  },
  orthodox: {
    name: 'Orthodox',
    slug: 'orthodox',
    overview:
      'Eastern Orthodox churches represent one of the oldest continuous Christian traditions, tracing their origins to the apostles and the early church. Orthodoxy emphasizes mystical worship, sacred tradition, the church fathers, and iconic imagery.',
    founded: 'Traces its origins to the apostles and the early church; formally distinct from Roman Catholicism after the Great Schism of 1054',
    governance: 'Episcopal (patriarchal)',
    governanceDescription:
      'Led by patriarchs and bishops in a conciliar structure. No single leader equivalent to the Pope; the Ecumenical Patriarch of Constantinople holds a position of honor. Each national church (Greek, Russian, Antiochian, etc.) is self-governing.',
    beliefs: [
      'Holy Tradition and Scripture together as sources of authority',
      'Seven Ecumenical Councils as definitive doctrinal statements',
      'Theosis (divinization)—the goal of Christian life is union with God',
      'Veneration of icons as windows to heaven',
      'Real presence of Christ in the Eucharist (Holy Mystery)',
    ],
    worshipDescription:
      'Ancient, highly liturgical worship featuring chanting, incense, icons, and standing (pews are often minimal). The Divine Liturgy follows forms dating to the 4th century. Services engage all five senses.',
    typicalWorshipStyles: ['Liturgical', 'Traditional'],
    sacraments: 'Seven Holy Mysteries (sacraments): Baptism, Chrismation, Eucharist, Confession, Anointing of the Sick, Marriage, Holy Orders',
    baptism: 'Infant baptism by triple immersion, immediately followed by Chrismation and first communion',
    communion: 'The Eucharist (Divine Liturgy) is the center of Orthodox life. Reserved for baptized and chrismated Orthodox Christians.',
    distinctives: [
      'Worship tradition largely unchanged for over 1,500 years',
      'Rich iconographic art tradition as theology in image',
      'Emphasis on mystery and the incomprehensibility of God',
      'Fasting traditions observed throughout the liturgical year',
    ],
    relatedDenominations: ['Catholic', 'Episcopal', 'Lutheran'],
  },
  evangelical: {
    name: 'Evangelical',
    slug: 'evangelical',
    overview:
      'Evangelical churches emphasize the authority of the Bible, personal conversion (being "born again"), the centrality of Christ\'s atonement, and active evangelism. Evangelicalism spans many denominations and independent churches.',
    founded: 'Roots in the 18th-century Great Awakening; modern evangelical movement solidified in the mid-20th century',
    governance: 'Varies (congregational is most common)',
    governanceDescription:
      'No single governance structure. Evangelical is a theological orientation that crosses denominations. Independent evangelical churches typically use congregational governance with pastoral leadership.',
    beliefs: [
      'Authority and inerrancy of the Bible',
      'Necessity of personal conversion (born-again experience)',
      'Centrality of Christ\'s death and resurrection for salvation',
      'Active expression of faith through evangelism and missions',
      'Generally conservative on social and moral issues',
    ],
    worshipDescription:
      'Contemporary worship is common with praise bands and projected lyrics. Preaching is prominent, often 30-45 minutes, focusing on biblical exposition and life application. Services are designed to be welcoming to seekers.',
    typicalWorshipStyles: ['Contemporary', 'Blended'],
    sacraments: 'Generally two ordinances: baptism and communion (viewed symbolically)',
    baptism: 'Believer\'s baptism by immersion is most common; some accept infant baptism',
    communion: 'Symbolic memorial of Christ\'s sacrifice; frequency and practice vary by congregation',
    distinctives: [
      'Cross-denominational movement united by core theological convictions',
      'Strong emphasis on Scripture as the ultimate authority',
      'Active in missions, parachurch organizations, and cultural engagement',
      'Includes both denominational and independent churches',
    ],
    relatedDenominations: ['Non-denominational', 'Baptist', 'Reformed'],
  },
  charismatic: {
    name: 'Charismatic',
    slug: 'charismatic',
    overview:
      'Charismatic churches emphasize the active work of the Holy Spirit and the continuation of spiritual gifts such as tongues, prophecy, and healing. Unlike classical Pentecostalism, the Charismatic movement emerged within mainline denominations before spawning independent churches.',
    founded: 'Charismatic renewal movement began in the 1960s within mainline Protestant and Catholic churches',
    governance: 'Varies widely (often apostolic or congregational)',
    governanceDescription:
      'No uniform governance. Independent charismatic churches may be led by an apostle or senior pastor with significant authority. Some belong to networks or associations for accountability and fellowship.',
    beliefs: [
      'All spiritual gifts are active today and available to every believer',
      'Baptism in the Holy Spirit empowers believers for ministry',
      'Divine healing, prophecy, and words of knowledge in regular use',
      'Authority of Scripture alongside ongoing revelation through the Spirit',
      'Spiritual warfare is a real and present reality',
    ],
    worshipDescription:
      'Extended, passionate worship with contemporary music, raised hands, and freedom of expression. Services may include prophecy, healing prayer, and spontaneous moments of worship. Atmosphere is often electric and emotionally engaging.',
    typicalWorshipStyles: ['Charismatic', 'Contemporary'],
    sacraments: 'Typically two ordinances: baptism and communion (symbolic)',
    baptism: 'Believer\'s baptism by immersion; some practice re-baptism upon Spirit-baptism experience',
    communion: 'Symbolic memorial; observed periodically with varying frequency',
    distinctives: [
      'Strong emphasis on the experiential dimension of faith',
      'Worship is dynamic, extended, and emotionally expressive',
      'Independent networks and apostolic movements rather than traditional denominations',
      'Growing rapidly worldwide, especially in the Global South',
    ],
    relatedDenominations: ['Pentecostal', 'Assemblies of God', 'Non-denominational'],
  },
  reformed: {
    name: 'Reformed',
    slug: 'reformed',
    overview:
      'Reformed churches follow the theological tradition of the Protestant Reformation, particularly the teachings of John Calvin. They emphasize God\'s sovereignty, the doctrines of grace, covenant theology, and confessional standards.',
    founded: '1520s-1530s in Switzerland through Ulrich Zwingli and John Calvin; spread throughout Europe',
    governance: 'Presbyterian or congregational (varies by tradition)',
    governanceDescription:
      'Reformed churches use either presbyterian governance (rule by elders in a multi-level court system) or modified congregational governance. Confessional standards guide theology and practice.',
    beliefs: [
      'The five solas: Scripture alone, faith alone, grace alone, Christ alone, glory to God alone',
      'Doctrines of grace (often summarized as TULIP or Calvinism)',
      'Covenant theology uniting the Old and New Testaments',
      'God\'s absolute sovereignty over salvation and all creation',
      'Adherence to historic Reformed confessions (Westminster, Heidelberg, Belgic, etc.)',
    ],
    worshipDescription:
      'Word-centered worship emphasizing Scripture reading, psalm singing, expository preaching, and prayer. Varies from formal and traditional (with psalms only) to contemporary. The sermon is typically the centerpiece of the service.',
    typicalWorshipStyles: ['Traditional', 'Blended'],
    sacraments: 'Two sacraments: Baptism and the Lord\'s Supper',
    baptism: 'Infant and adult baptism as a sign of the covenant; typically by sprinkling or pouring',
    communion: 'Spiritual presence of Christ. Frequency varies; observed with reverence and self-examination.',
    distinctives: [
      'Rich intellectual tradition emphasizing theology and catechism',
      'Psalm singing tradition in some congregations',
      'Confessional identity shaped by historic documents',
      'Resurgence in younger generations ("New Calvinism" movement)',
    ],
    relatedDenominations: ['Presbyterian', 'Baptist', 'Lutheran'],
  },
};

// Get all denomination profile slugs
export function getDenominationProfileSlugs(): string[] {
  return Object.keys(DENOMINATION_PROFILES);
}

// Get a denomination profile by slug
export function getDenominationProfile(slug: string): DenominationProfile | null {
  return DENOMINATION_PROFILES[slug] || null;
}

// Comparison categories for the UI
export const COMPARISON_CATEGORIES = [
  { key: 'overview', label: 'Overview' },
  { key: 'founded', label: 'Origins' },
  { key: 'governance', label: 'Church Governance' },
  { key: 'beliefs', label: 'Key Beliefs' },
  { key: 'worshipDescription', label: 'Worship Style' },
  { key: 'sacraments', label: 'Sacraments & Ordinances' },
  { key: 'baptism', label: 'Baptism' },
  { key: 'communion', label: 'Communion' },
  { key: 'distinctives', label: 'Distinctives' },
] as const;
